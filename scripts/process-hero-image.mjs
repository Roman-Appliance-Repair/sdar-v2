// scripts/process-hero-image.mjs
//
// One-shot processor for the homepage hero photograph.
// Picks up any unprocessed .jpg/.jpeg/.png/.webp file in public/images/hero/,
// emits three optimized variants (desktop WebP + JPG fallback + mobile WebP),
// and removes the source. Re-running after the source is gone is a no-op.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const HERO_DIR = path.resolve('./public/images/hero');
const OUTPUT_BASENAME = 'hero-technician-subzero';

const files = fs.readdirSync(HERO_DIR);
const sourceFile = files.find(
  (f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith(OUTPUT_BASENAME)
);

if (!sourceFile) {
  console.error('No source image found in', HERO_DIR);
  console.error('Files present:', files);
  process.exit(1);
}

const sourcePath = path.join(HERO_DIR, sourceFile);
console.log(`Processing source: ${sourcePath}`);

const metadata = await sharp(sourcePath).metadata();
console.log(`Source: ${metadata.width}×${metadata.height} ${metadata.format}`);

await sharp(sourcePath)
  .resize(2400, 1350, { fit: 'cover', position: 'center' })
  .webp({ quality: 88, effort: 6 })
  .toFile(path.join(HERO_DIR, `${OUTPUT_BASENAME}.webp`));
console.log(`✓ Created ${OUTPUT_BASENAME}.webp (2400×1350)`);

await sharp(sourcePath)
  .resize(2400, 1350, { fit: 'cover', position: 'center' })
  .jpeg({ quality: 85, progressive: true, mozjpeg: true })
  .toFile(path.join(HERO_DIR, `${OUTPUT_BASENAME}.jpg`));
console.log(`✓ Created ${OUTPUT_BASENAME}.jpg (2400×1350)`);

await sharp(sourcePath)
  .resize(1080, 1350, { fit: 'cover', position: 'right' })
  .webp({ quality: 85, effort: 6 })
  .toFile(path.join(HERO_DIR, `${OUTPUT_BASENAME}-mobile.webp`));
console.log(`✓ Created ${OUTPUT_BASENAME}-mobile.webp (1080×1350)`);

fs.unlinkSync(sourcePath);
console.log(`✓ Removed source file: ${sourceFile}`);

const final = fs.readdirSync(HERO_DIR);
console.log(`\nFinal files in ${HERO_DIR}`);
for (const f of final) {
  const stats = fs.statSync(path.join(HERO_DIR, f));
  const kb = (stats.size / 1024).toFixed(1);
  console.log(`  ${f}  (${kb} KB)`);
}
