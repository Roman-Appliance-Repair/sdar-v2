/**
 * hours-ssot-sweep-2026-07-15.mjs — UI Phase 1.1, step B1.
 *
 * Fixes the two hours-SSOT violations Wave 36 missed:
 *   19 files: "Mon–Sun 7am–9pm[ · suffix]"  (an always-open claim — wrong)
 *    3 files: "Mon–Sat Mon–Sat 8am–8pm · …" (duplicated token)
 *
 * Both are replaced with {BUSINESS_HOURS.display} imported from the SSOT
 * (src/data/business-hours.ts), not a re-typed literal — factual-accuracy.md §8
 * says the visible string is imported from there, and a literal is exactly how
 * these 22 drifted in the first place.
 *
 * Non-hours suffixes ("· Commercial calls prioritized", "· Gas-certified techs")
 * are separate true claims and are preserved verbatim. The one exception is
 * "· Phones answered 24/7", which the canonical string already states — keeping
 * it would render "…Phone answered 24/7 · Phones answered 24/7".
 *
 * Run: node scripts/hours-ssot-sweep-2026-07-15.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const BAD_SUN = /Mon–Sun 7am–9pm/;
const BAD_DUP = /Mon–Sat Mon–Sat 8am–8pm · Sun closed · Phone answered 24\/7/;

const files = execSync(
  'git grep -l "Mon–Sun 7am–9pm\\|Mon–Sat Mon–Sat" -- src/',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

/** relative specifier from a page file to src/data/business-hours */
function importPath(file) {
  const rel = path.relative(path.dirname(file), 'src/data/business-hours').split(path.sep).join('/');
  return rel.startsWith('.') ? rel : './' + rel;
}

const report = [];

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const before = src;
  const hits = [];

  // 1) duplicated Mon–Sat token -> canonical from SSOT
  if (BAD_DUP.test(src)) {
    src = src.replace(
      /Mon–Sat Mon–Sat 8am–8pm · Sun closed · Phone answered 24\/7/g,
      '{BUSINESS_HOURS.display}'
    );
    hits.push('duplicated Mon–Sat');
  }

  // 2) Mon–Sun 7am–9pm [· suffix] -> canonical + preserved suffix
  if (BAD_SUN.test(src)) {
    src = src.replace(/Mon–Sun 7am–9pm((?: · [^<"'{]*)?)/g, (_m, suffix) => {
      const s = (suffix || '').trim();
      // canonical already says "Phone answered 24/7" — drop the echo
      if (/^· Phones? answered 24\/7$/i.test(s)) return '{BUSINESS_HOURS.display}';
      return '{BUSINESS_HOURS.display}' + (s ? ' ' + s : '');
    });
    hits.push('Mon–Sun 7am–9pm');
  }

  if (src === before) continue;

  // 3) ensure the SSOT import exists (insert after the last frontmatter import)
  if (!/BUSINESS_HOURS/.test(before)) {
    const fmEnd = src.indexOf('\n---', 3);
    const fm = src.slice(0, fmEnd);
    const importRe = /^import .*$/gm;
    let last = null, m;
    while ((m = importRe.exec(fm)) !== null) last = m;
    if (!last) throw new Error('no import block found in ' + file);
    const line = `\nimport { BUSINESS_HOURS } from '${importPath(file)}';`;
    src = src.slice(0, last.index + last[0].length) + line + src.slice(last.index + last[0].length);
    hits.push('+import');
  }

  writeFileSync(file, src, 'utf8');
  report.push({ file, hits: hits.join(', ') });
}

console.log('HOURS SSOT SWEEP — ' + report.length + ' files changed\n');
for (const r of report) console.log('  ' + r.file.padEnd(58) + r.hits);
console.log('\nRemaining violations (must be 0):');
for (const pat of ['Mon–Sun 7am–9pm', 'Mon–Sat Mon–Sat']) {
  let n = 0;
  try { n = execSync(`git grep -c "${pat}" -- src/ | wc -l`, { encoding: 'utf8' }).trim(); }
  catch { n = '0'; }
  console.log('  ' + pat.padEnd(24) + n);
}
