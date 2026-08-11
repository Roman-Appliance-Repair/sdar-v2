// One-off: re-encode public/images/cities/*/neighborhood.webp at quality 78.
// Keeps pixel dimensions, filename and path (overwrite in place). If the
// re-encoded file is not smaller, the original is kept ("SKIP <path>").
// Hero images and every other directory are untouched.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const files = globSync('public/images/cities/*/neighborhood.webp').sort();
if (!files.length) { console.error('no files matched'); process.exit(1); }

const rows = [];
let totalBefore = 0, totalAfter = 0, skipped = 0;
for (const f of files) {
  const before = statSync(f).size;
  const src = readFileSync(f);
  const meta = await sharp(src).metadata();
  const out = await sharp(src).webp({ quality: 78 }).toBuffer();
  const outMeta = await sharp(out).metadata();
  if (outMeta.width !== meta.width || outMeta.height !== meta.height) {
    console.log(`SKIP ${f} (dimension mismatch ${outMeta.width}x${outMeta.height} vs ${meta.width}x${meta.height})`);
    skipped++; totalBefore += before; totalAfter += before;
    continue;
  }
  if (out.length >= before) {
    console.log(`SKIP ${f} (recoded ${out.length} >= original ${before})`);
    skipped++; totalBefore += before; totalAfter += before;
    continue;
  }
  writeFileSync(f, out);
  totalBefore += before; totalAfter += out.length;
  rows.push({ f, before, after: out.length });
}

console.log(`\n${'file'.padEnd(62)}${'before KB'.padStart(10)}${'after KB'.padStart(10)}${'delta %'.padStart(9)}`);
for (const r of rows) {
  const d = (100 * (r.after - r.before) / r.before).toFixed(1);
  console.log(`${r.f.padEnd(62)}${(r.before / 1024).toFixed(0).padStart(10)}${(r.after / 1024).toFixed(0).padStart(10)}${d.padStart(8)}%`);
}
console.log(`\nTOTAL before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB · after: ${(totalAfter / 1024 / 1024).toFixed(2)} MB · saved: ${((totalBefore - totalAfter) / 1024).toFixed(0)} KB · recompressed: ${rows.length} · skipped: ${skipped}`);
