// Second-pass migration for pages that are ALREADY wrapped in <Layout>
// but still have:
//   (a) JSON-LD <script> tags in the body (should move to head-scripts slot)
//   (b) inline `.hero h1 { ... }` / `h1 { ... }` CSS rules (should drop; global handles them)
//
// Targets: price-list/*, for-business/*, credentials/* (excluding index.astro)
// Skips:   any file whose JSON-LD is already inside <Fragment slot="head-scripts">

import { readFile, writeFile, readdir } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const PAGES = new URL('src/pages/', ROOT);

const TARGET_DIRS = ['price-list', 'for-business', 'credentials'];

function escForTemplateLiteral(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

// Drop any CSS rule whose selector list contains a standalone `h1` token.
function stripH1Rules(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    // Find next { starting at selector
    const braceStart = css.indexOf('{', i);
    if (braceStart === -1) {
      out.push(css.slice(i));
      break;
    }
    // Walk to matching }
    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const selector = css.slice(i, braceStart);
    const block = css.slice(braceStart, j);
    // Test selector for standalone h1 word (not h10, not .h1)
    const hasH1 = /(^|[^\w.-])h1(?![\w-])/.test(selector);
    if (!hasH1) {
      out.push(selector + block);
    }
    // If hasH1 — we drop selector+block entirely.
    i = j;
  }
  return out.join('');
}

async function processFile(filePath) {
  const raw = await readFile(filePath, 'utf8');

  // Must be Layout-wrapped
  if (!/<Layout\b/.test(raw)) return { status: 'skipped-no-layout' };

  // Skip if there are zero JSON-LD scripts in the file
  const hasLd = /<script\s+type=["']application\/ld\+json["']\s*>/i.test(raw);
  const hasH1Rule = /(^|[^\w.-])h1(?![\w-])[^{}]*\{[^}]*\}/.test(raw);

  if (!hasLd && !hasH1Rule) return { status: 'skipped-nothing-to-do' };

  // Skip if JSON-LD is already in head-scripts slot (avoid double-wrapping)
  const ldAlreadyInSlot = /slot=["']head-scripts["']/.test(raw);

  let out = raw;
  let schemaCount = 0;

  if (hasLd && !ldAlreadyInSlot) {
    // Extract all JSON-LD scripts. Closing tag may be `</script>` OR `<\/script>`
    // (Astro auto-escapes slashes inside some contexts).
    const schemas = [];
    out = out.replace(
      /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\\?\/script>\s*/gi,
      (_m, body) => {
        schemas.push(body.trim());
        return '';
      }
    );
    schemaCount = schemas.length;

    if (schemas.length === 0) {
      // regex failed entirely — leave file untouched, report as error
      return { status: 'skipped-ld-regex-miss' };
    }

    // Build the Fragment block
    let fragment;
    if (schemas.length === 1) {
      fragment =
        `  <Fragment slot="head-scripts">\n` +
        `    <script type="application/ld+json" set:html={schemaJson}></script>\n` +
        `  </Fragment>\n\n`;
    } else {
      fragment =
        `  <Fragment slot="head-scripts">\n` +
        `    {schemaJsons.map((s) => (\n` +
        `      <script type="application/ld+json" set:html={s}></script>\n` +
        `    ))}\n` +
        `  </Fragment>\n\n`;
    }

    // Inject fragment right after the <Layout ...> opening tag
    out = out.replace(/(<Layout\b[^>]*>\s*\n?)/, (m, open) => open + fragment);

    // Add schema const(s) to frontmatter
    const frontmatterMatch = out.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) throw new Error('No frontmatter found');
    const fmBody = frontmatterMatch[1];

    let schemaConst;
    if (schemas.length === 1) {
      schemaConst = `\nconst schemaJson = \`${escForTemplateLiteral(schemas[0])}\`;`;
    } else {
      const arr = schemas.map((s) => `\`${escForTemplateLiteral(s)}\``).join(',\n  ');
      schemaConst = `\nconst schemaJsons = [\n  ${arr},\n];`;
    }

    const newFm = fmBody + schemaConst;
    out = out.replace(frontmatterMatch[0], `---\n${newFm}\n---`);
  }

  // Strip h1 rules from any <style> blocks
  out = out.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (full, css) => {
    const cleaned = stripH1Rules(css);
    const openTagMatch = full.match(/<style\b[^>]*>/i);
    const openTag = openTagMatch ? openTagMatch[0] : '<style>';
    return `${openTag}${cleaned}</style>`;
  });

  // Collapse any accidental triple blank lines created by removals
  out = out.replace(/\n{3,}/g, '\n\n');

  await writeFile(filePath, out, 'utf8');
  return { status: 'updated', schemaCount };
}

async function main() {
  const report = { updated: [], skipped: [], errors: [] };

  for (const dir of TARGET_DIRS) {
    const dirUrl = new URL(dir + '/', PAGES);
    const entries = await readdir(dirUrl);
    for (const entry of entries) {
      if (!entry.endsWith('.astro')) continue;
      if (entry === 'index.astro') {
        report.skipped.push(`${dir}/${entry} (index)`);
        continue;
      }
      const full = new URL(entry, dirUrl).pathname.replace(/^\/([A-Z]):/, '$1:');
      try {
        const r = await processFile(full);
        if (r.status === 'updated') {
          report.updated.push(`${dir}/${entry} [${r.schemaCount} schema moved]`);
        } else {
          report.skipped.push(`${dir}/${entry} (${r.status})`);
        }
      } catch (e) {
        report.errors.push(`${dir}/${entry}: ${e.message}`);
      }
    }
  }

  console.log('=== UPDATED ===');
  report.updated.forEach((l) => console.log('  ' + l));
  console.log(`\n=== SKIPPED (${report.skipped.length}) ===`);
  report.skipped.forEach((l) => console.log('  ' + l));
  if (report.errors.length) {
    console.log(`\n=== ERRORS (${report.errors.length}) ===`);
    report.errors.forEach((l) => console.log('  ' + l));
  }
  console.log(`\nTotals: updated=${report.updated.length}, skipped=${report.skipped.length}, errors=${report.errors.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
