import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const citiesDir = 'public/images/cities';
const dirs = fs.readdirSync(citiesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

const variants = [
  { width: 640, quality: 68 },
  { width: 960, quality: 70 },
];

async function encodeVariant(srcPath, outDir, width, quality) {
  const webpOut = path.join(outDir, `hero-${width}.webp`);
  const jpgOut = path.join(outDir, `hero-${width}.jpg`);

  const webpInfo = await sharp(srcPath)
    .resize(width, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 6, smartSubsample: true })
    .withMetadata({ exif: {}, icc: undefined })
    .toFile(webpOut);

  const jpgInfo = await sharp(srcPath)
    .resize(width, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: quality + 8, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .withMetadata({ exif: {}, icc: undefined })
    .toFile(jpgOut);

  return { webp: webpInfo.size, jpg: jpgInfo.size };
}

async function run() {
  const results = [];
  let totalSize = 0;
  let count = 0;
  let skipped = 0;

  for (const city of dirs) {
    const src = `${citiesDir}/${city}/hero.webp`;
    if (!fs.existsSync(src)) {
      console.log(`SKIP ${city} - no source hero.webp`);
      skipped++;
      continue;
    }

    const outDir = `${citiesDir}/${city}`;
    const sizes = { city, src640w: 0, src640j: 0, src960w: 0, src960j: 0 };

    for (const v of variants) {
      const r = await encodeVariant(src, outDir, v.width, v.quality);
      if (v.width === 640) {
        sizes.src640w = r.webp;
        sizes.src640j = r.jpg;
      } else {
        sizes.src960w = r.webp;
        sizes.src960j = r.jpg;
      }
      totalSize += r.webp + r.jpg;
    }

    results.push(sizes);
    count++;
    console.log(`OK ${city.padEnd(22)} 640: ${(sizes.src640w/1024).toFixed(1)}K+${(sizes.src640j/1024).toFixed(1)}K | 960: ${(sizes.src960w/1024).toFixed(1)}K+${(sizes.src960j/1024).toFixed(1)}K`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Cities processed: ${count}`);
  console.log(`Cities skipped:   ${skipped}`);
  console.log(`Total new files:  ${count * 4} (${count} x 4 variants)`);
  console.log(`Total disk added: ${(totalSize/1024/1024).toFixed(2)} MB`);

  if (results.length > 0) {
    const avg640w = results.reduce((s, r) => s + r.src640w, 0) / results.length / 1024;
    const avg640j = results.reduce((s, r) => s + r.src640j, 0) / results.length / 1024;
    const avg960w = results.reduce((s, r) => s + r.src960w, 0) / results.length / 1024;
    const avg960j = results.reduce((s, r) => s + r.src960j, 0) / results.length / 1024;
    console.log(`Avg 640w WebP:    ${avg640w.toFixed(1)} KB`);
    console.log(`Avg 640w JPG:     ${avg640j.toFixed(1)} KB`);
    console.log(`Avg 960w WebP:    ${avg960w.toFixed(1)} KB`);
    console.log(`Avg 960w JPG:     ${avg960j.toFixed(1)} KB`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
