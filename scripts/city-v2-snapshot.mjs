/**
 * city-v2-snapshot.mjs — capture / compare the rendered shape of city pillars.
 *
 * The component extraction must not change what a page renders, only where the
 * markup lives. Class names are allowed to move; sections, order and links are not.
 * So snapshot BEFORE, refactor, snapshot AFTER, diff.
 *
 *   node scripts/city-v2-snapshot.mjs before
 *   node scripts/city-v2-snapshot.mjs after
 *   node scripts/city-v2-snapshot.mjs diff
 *
 * Snapshots land in the scratchpad (not the repo).
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/4389fae3-be43-44bd-8391-a83ca37281f6/scratchpad';
const CITIES = ['west-hollywood', 'beverly-hills', 'los-angeles', 'santa-monica', 'pasadena'];

/** everything that matters about a page, ignoring class-name churn */
function shape(slug) {
  const file = `dist/${slug}/index.html`;
  if (!fs.existsSync(file)) return { slug, missing: true };
  const html = fs.readFileSync(file, 'utf8');
  // strip JSON-LD so schema formatting churn does not register as a diff
  const body = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

  // internal links, deduped + sorted: the SEO surface must be identical
  const links = [...new Set([...body.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))].sort();

  // visible headings, in order: proves section order and content survived
  const headings = [...body.matchAll(/<h([12345])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) =>
    m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  );

  // images actually referenced
  const imgs = [...new Set([...body.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]))].sort();

  // plain text, normalised — catches copy loss
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    slug,
    linkCount: links.length,
    links,
    headings,
    imgs,
    textLength: text.length,
    // a few structural markers
    sections: (body.match(/<section/g) || []).length,
  };
}

const mode = process.argv[2];
if (mode === 'before' || mode === 'after') {
  const snap = Object.fromEntries(CITIES.map((c) => [c, shape(c)]));
  fs.writeFileSync(path.join(OUT, `city-v2-${mode}.json`), JSON.stringify(snap, null, 1));
  console.log(`${mode} snapshot written`);
  for (const c of CITIES) {
    const s = snap[c];
    console.log(
      `  ${c.padEnd(16)} links=${String(s.linkCount).padStart(3)}  headings=${String(s.headings.length).padStart(2)}  sections=${String(s.sections).padStart(2)}  imgs=${String(s.imgs.length).padStart(2)}  text=${s.textLength}`
    );
  }
  process.exit(0);
}

if (mode === 'diff') {
  const a = JSON.parse(fs.readFileSync(path.join(OUT, 'city-v2-before.json'), 'utf8'));
  const b = JSON.parse(fs.readFileSync(path.join(OUT, 'city-v2-after.json'), 'utf8'));
  let fail = 0;
  for (const c of CITIES) {
    const x = a[c], y = b[c];
    console.log(`\n── ${c} ──`);
    const lostLinks = x.links.filter((l) => !y.links.includes(l));
    const newLinks = y.links.filter((l) => !x.links.includes(l));
    const lostHead = x.headings.filter((h) => !y.headings.includes(h));
    const newHead = y.headings.filter((h) => !x.headings.includes(h));
    const lostImg = x.imgs.filter((i) => !y.imgs.includes(i));
    const newImg = y.imgs.filter((i) => !x.imgs.includes(i));

    console.log(`  links     ${x.linkCount} -> ${y.linkCount}`);
    if (lostLinks.length) { fail++; console.log('    LOST:', lostLinks.join(', ')); }
    if (newLinks.length) console.log('    added:', newLinks.join(', '));
    console.log(`  headings  ${x.headings.length} -> ${y.headings.length}`);
    if (lostHead.length) { fail++; console.log('    LOST:', lostHead.map((h) => JSON.stringify(h)).join(', ')); }
    if (newHead.length) console.log('    added:', newHead.map((h) => JSON.stringify(h)).join(', '));
    console.log(`  images    ${x.imgs.length} -> ${y.imgs.length}`);
    if (lostImg.length) { fail++; console.log('    LOST:', lostImg.join(', ')); }
    if (newImg.length) console.log('    added:', newImg.join(', '));
    const dt = y.textLength - x.textLength;
    console.log(`  text      ${x.textLength} -> ${y.textLength} (${dt >= 0 ? '+' : ''}${dt})`);
    // headings order
    const orderSame = JSON.stringify(x.headings.filter((h) => y.headings.includes(h))) ===
      JSON.stringify(y.headings.filter((h) => x.headings.includes(h)));
    console.log(`  order of shared headings preserved: ${orderSame}`);
    if (!orderSame) fail++;
  }
  console.log('\n' + (fail ? `FAIL — ${fail} regression(s)` : 'OK — no links, headings, or images lost; order preserved'));
  process.exit(fail ? 1 : 0);
}

console.error('usage: node scripts/city-v2-snapshot.mjs before|after|diff');
process.exit(2);
