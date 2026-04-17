// One-shot: wrap a single bare HTML .astro page in <Layout>.
// Usage: node scripts/wrap-single-bare.mjs <relative-path-from-pages>
// Example: node scripts/wrap-single-bare.mjs services/garbage-disposal-repair.astro

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/wrap-single-bare.mjs <path-from-src-pages>');
  process.exit(1);
}

const ROOT = new URL('../', import.meta.url);
const filePath = new URL(`src/pages/${arg}`, ROOT).pathname.replace(/^\/([A-Z]):/, '$1:');

// Depth from file to src/layouts/Layout.astro.
// File at src/pages/X.astro → depthSegments=0 → '../layouts/Layout.astro' (out of pages/)
// File at src/pages/services/X.astro → depthSegments=1 → '../../layouts/Layout.astro'
const depthSegments = arg.split('/').length - 1;
const depthPath = '../'.repeat(depthSegments + 1).replace(/\/$/, '');

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}
function jsString(s) {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').trim() + '"';
}

const raw = await readFile(filePath, 'utf8');

if (/import\s+Layout\s+from/.test(raw)) {
  console.error('Already wrapped (Layout import present). Aborting.');
  process.exit(1);
}
if (!/<!DOCTYPE\s+html>/i.test(raw)) {
  console.error('Not a bare HTML file (no DOCTYPE). Aborting.');
  process.exit(1);
}

// 1. Extract existing frontmatter comment block (--- ... ---), keep comments only
const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
const fmComments = fmMatch ? fmMatch[1].trim() : '';
let tail = fmMatch ? raw.slice(fmMatch[0].length) : raw;

// 2. Extract <head>...</head>
const headMatch = tail.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
if (!headMatch) { console.error('No <head> found'); process.exit(1); }
const headInner = headMatch[1];

// 3. From head: title
const titleMatch = headInner.match(/<title>([\s\S]*?)<\/title>/i);
const title = titleMatch ? titleMatch[1].trim() : '';

// 4. From head: meta description
const descMatch = headInner.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
const description = descMatch ? descMatch[1].trim() : '';

// 5. From head: JSON-LD scripts (preserve order)
const schemas = [];
for (const m of headInner.matchAll(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi)) {
  schemas.push(m[1].trim());
}

// 6. From head: <style> blocks (may be multiple — preserve)
const styles = [];
for (const m of headInner.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
  styles.push(m[0]); // keep full tag with attributes
}

// 7. Extract <body>...</body>
const bodyMatch = tail.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) { console.error('No <body> found'); process.exit(1); }
const bodyInner = bodyMatch[1].trim();

// Build frontmatter
const fmLines = [];
if (fmComments) { fmLines.push(fmComments, ''); }
fmLines.push(`import Layout from '${depthPath}/layouts/Layout.astro';`);
fmLines.push('');
fmLines.push(`const title = ${jsString(title || 'Same Day Appliance Repair')};`);
fmLines.push(`const description = ${jsString(description || '')};`);

let schemaBlock = '';
if (schemas.length === 1) {
  fmLines.push(`const schemaJson = \`${esc(schemas[0])}\`;`);
  schemaBlock =
    `  <Fragment slot="head-scripts">\n` +
    `    <script type="application/ld+json" set:html={schemaJson}></script>\n` +
    `  </Fragment>\n\n`;
} else if (schemas.length > 1) {
  const arr = schemas.map((s) => `\`${esc(s)}\``).join(',\n  ');
  fmLines.push(`const schemaJsons = [\n  ${arr},\n];`);
  schemaBlock =
    `  <Fragment slot="head-scripts">\n` +
    `    {schemaJsons.map((s) => (\n` +
    `      <script type="application/ld+json" set:html={s}></script>\n` +
    `    ))}\n` +
    `  </Fragment>\n\n`;
}

const out =
  `---\n` +
  fmLines.join('\n') +
  `\n---\n\n` +
  `<Layout title={title} description={description}>\n` +
  schemaBlock +
  styles.map((s) => '  ' + s.split('\n').join('\n  ')).join('\n\n') +
  (styles.length ? '\n\n' : '') +
  bodyInner + '\n' +
  `</Layout>\n`;

await writeFile(filePath, out, 'utf8');

console.log(`✓ Wrapped ${arg}`);
console.log(`  depthPath:    ${depthPath}/layouts/Layout.astro`);
console.log(`  title:        ${title.slice(0, 60)}...`);
console.log(`  description:  ${description.slice(0, 60)}...`);
console.log(`  schemas:      ${schemas.length}`);
console.log(`  style blocks: ${styles.length}`);
console.log(`  body length:  ${bodyInner.length} chars`);
