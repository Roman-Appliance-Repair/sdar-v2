import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const DOWNLOADS = 'C:/Users/Roman/Downloads';
const OUT_BASE = 'public/images/outdoor';

const PASS1_Q = 70;
const PASS2_Q = 60;
const PASS3_Q = 52;
const PASS2_THRESHOLD = 240 * 1024;
const PASS3_THRESHOLD = 250 * 1024;

// File 5 (_70128) SKIPPED — superseded by File 8 (_35666) for the new
// wine-cellar-repair pillar.
const MAPPING = [
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_90056.png', 'grill-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_12734.png', 'kitchen-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_01062.png', 'pizza-oven-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_71219.png', 'smoker-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_95312.png', 'fireplace-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_11305.png', 'patio-heater-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_35666.png', 'wine-cellar-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_95324.png', 'kitchen-maintenance'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_68482.png', 'wine-cellar-maintenance'],
  ['A_wide_cinematic_establishing__Nano_Banana_2_49024.png', 'index'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_48193.png', 'grill-repair-beverly-hills'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_82316.png', 'kitchen-repair-malibu'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_04433.png', 'kitchen-repair-newport-beach'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_41813.png', 'kitchen-repair-thousand-oaks'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_12501.png', 'wine-cellar-repair-bel-air'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_95798.png', 'wine-cellar-repair-beverly-hills'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_53469.png', 'wine-cellar-repair-malibu'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_41216.png', 'wine-cellar-repair-newport-beach'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_73401.png', 'wine-cellar-repair-pacific-palisades'],
];

async function encodeWebp(src, out, quality) {
  await sharp(src)
    .resize(1920, null, { fit: 'inside', withoutEnlargement: false })
    .webp({ quality, effort: 6, smartSubsample: true })
    .withMetadata({ exif: {} })
    .toFile(out);
  const st = await fs.stat(out);
  return st.size;
}

async function encodeJpeg(src, out) {
  await sharp(src)
    .resize(1920, null, { fit: 'inside', withoutEnlargement: false })
    .jpeg({ quality: 76, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .withMetadata({ exif: {} })
    .toFile(out);
  const st = await fs.stat(out);
  return st.size;
}

const results = [];
for (const [pngName, slug] of MAPPING) {
  const src = path.join(DOWNLOADS, pngName);
  const outDir = path.join(OUT_BASE, slug);
  await fs.mkdir(outDir, { recursive: true });
  const outWebp = path.join(outDir, 'hero.webp');
  const outJpg = path.join(outDir, 'hero.jpg');

  let pass = 1;
  let size = await encodeWebp(src, outWebp, PASS1_Q);
  if (size > PASS2_THRESHOLD) {
    pass = 2;
    size = await encodeWebp(src, outWebp, PASS2_Q);
    if (size > PASS3_THRESHOLD) {
      pass = 3;
      size = await encodeWebp(src, outWebp, PASS3_Q);
    }
  }
  const jpgSize = await encodeJpeg(src, outJpg);
  results.push({ slug, pass, webp: size, jpg: jpgSize });
  console.log(`${slug.padEnd(40)}  pass${pass}  webp=${(size/1024).toFixed(1).padStart(6)} KB  jpg=${(jpgSize/1024).toFixed(1).padStart(6)} KB`);
}

const avgWebp = results.reduce((a, r) => a + r.webp, 0) / results.length / 1024;
const avgJpg = results.reduce((a, r) => a + r.jpg, 0) / results.length / 1024;
const pass2 = results.filter(r => r.pass === 2).length;
const pass3 = results.filter(r => r.pass === 3).length;
const over250 = results.filter(r => r.webp > 250 * 1024).length;

console.log('\n=== Summary ===');
console.log(`Avg WebP: ${avgWebp.toFixed(1)} KB`);
console.log(`Avg JPG:  ${avgJpg.toFixed(1)} KB`);
console.log(`Pass 2 invoked: ${pass2} / ${results.length}`);
console.log(`Pass 3 invoked: ${pass3} / ${results.length}`);
console.log(`Files still over 250 KB: ${over250}`);
