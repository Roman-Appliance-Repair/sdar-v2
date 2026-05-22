import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const DOWNLOADS = 'C:/Users/Roman/Downloads';
const OUT_BASE = 'public/images/services';

const PASS1_Q = 70;
const PASS2_Q = 60;
const PASS3_Q = 52;
const PASS2_THRESHOLD = 240 * 1024;
const PASS3_THRESHOLD = 250 * 1024;

const MAPPING = [
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_36693.png', 'refrigerator-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_13345.png', 'built-in-refrigerator'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_79645.png', 'freezer-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_17634.png', 'washer-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_41189.png', 'dryer-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_84470.png', 'dryer-vent-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_51041.png', 'laundry-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_02928.png', 'stackable-washer-dryer-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_74102.png', 'dishwasher-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_62838.png', 'oven-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_09009.png', 'wall-oven-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_32247.png', 'range-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_70411.png', 'stove-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_20469.png', 'cooktop-repair'],
  ['A_wide_cinematic_photograph_of_Nano_Banana_2_60323.png', 'induction-cooktop-repair'],
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
  console.log(`${slug.padEnd(32)}  pass${pass}  webp=${(size/1024).toFixed(1).padStart(6)} KB  jpg=${(jpgSize/1024).toFixed(1).padStart(6)} KB`);
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
