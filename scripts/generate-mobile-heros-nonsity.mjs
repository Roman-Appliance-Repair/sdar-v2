import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Parameterized companion to generate-mobile-heros.mjs (which handles /cities).
// Generates 640w + 960w WebP+JPG variants for all non-city hero directories.
// Idempotent: skips a (width,format) pair if both files already exist.

const ROOTS = [
  'public/images/commercial',
  'public/images/services',
  'public/images/outdoor',
];

const variants = [
  { width: 640, quality: 68 },
  { width: 960, quality: 70 },
];

async function encodeVariant(srcPath, outDir, width, quality) {
  const webpOut = path.join(outDir, `hero-${width}.webp`);
  const jpgOut = path.join(outDir, `hero-${width}.jpg`);

  const skipWebp = fs.existsSync(webpOut);
  const skipJpg = fs.existsSync(jpgOut);

  let webpSize = skipWebp ? fs.statSync(webpOut).size : 0;
  let jpgSize = skipJpg ? fs.statSync(jpgOut).size : 0;

  if (!skipWebp) {
    const info = await sharp(srcPath)
      .resize(width, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 6, smartSubsample: true })
      .withMetadata({ exif: {}, icc: undefined })
      .toFile(webpOut);
    webpSize = info.size;
  }

  if (!skipJpg) {
    const info = await sharp(srcPath)
      .resize(width, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: quality + 8, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .withMetadata({ exif: {}, icc: undefined })
      .toFile(jpgOut);
    jpgSize = info.size;
  }

  return { webp: webpSize, jpg: jpgSize, skipWebp, skipJpg };
}

async function run() {
  const results = [];
  let totalSize = 0;
  let processedDirs = 0;
  let skippedDirs = 0;
  let processedIdx = 0;

  // First pass: count expected dirs for [N/total] progress
  let expectedTotal = 0;
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    const subs = fs.readdirSync(root, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const sub of subs) {
      if (fs.existsSync(path.join(root, sub, 'hero.webp'))) expectedTotal++;
    }
  }

  for (const root of ROOTS) {
    if (!fs.existsSync(root)) {
      console.log(`SKIP root (not found): ${root}`);
      continue;
    }
    const subs = fs.readdirSync(root, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    console.log(`\n=== ${root} (${subs.length} dirs) ===`);

    for (const sub of subs) {
      const src = path.join(root, sub, 'hero.webp');
      if (!fs.existsSync(src)) {
        console.log(`  SKIP ${sub} - no source hero.webp`);
        skippedDirs++;
        continue;
      }

      const outDir = path.join(root, sub);
      const sizes = { root, sub, src640w: 0, src640j: 0, src960w: 0, src960j: 0 };
      let allCached = true;

      for (const v of variants) {
        const r = await encodeVariant(src, outDir, v.width, v.quality);
        if (v.width === 640) {
          sizes.src640w = r.webp;
          sizes.src640j = r.jpg;
        } else {
          sizes.src960w = r.webp;
          sizes.src960j = r.jpg;
        }
        if (!r.skipWebp || !r.skipJpg) {
          totalSize += r.webp + r.jpg;
          allCached = false;
        }
      }

      results.push(sizes);
      processedDirs++;
      processedIdx++;
      const tag = allCached ? 'CACHED' : 'OK    ';
      console.log(`  [${processedIdx}/${expectedTotal}] ${tag} ${sub.padEnd(38)} 640: ${(sizes.src640w/1024).toFixed(1)}K+${(sizes.src640j/1024).toFixed(1)}K | 960: ${(sizes.src960w/1024).toFixed(1)}K+${(sizes.src960j/1024).toFixed(1)}K`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Directories processed: ${processedDirs}`);
  console.log(`Directories skipped:   ${skippedDirs}`);
  console.log(`Total new variants:    ${processedDirs * 4} (${processedDirs} dirs x 4 variants)`);
  console.log(`Total disk added now:  ${(totalSize/1024/1024).toFixed(2)} MB (only newly written files)`);

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
