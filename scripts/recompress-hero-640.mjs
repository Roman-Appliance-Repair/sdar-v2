import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Recompresses all hero-640.webp (q→55) and hero-640.jpg (q→70) site-wide.
// Run AFTER initial variant generation (generate-mobile-heros.mjs +
// generate-mobile-heros-nonsity.mjs) — tightens the mobile hero payload
// once visual review on q68 confirmed q55 is indistinguishable on phones.

const ROOTS = [
  'public/images/cities',
  'public/images/commercial',
  'public/images/services',
  'public/images/outdoor',
];

const WEBP_Q = 55;
const JPG_Q = 70;

async function recompressWebp(file) {
  const input = fs.readFileSync(file);
  const before = input.length;
  const buf = await sharp(input)
    .webp({ quality: WEBP_Q, effort: 6, smartSubsample: true })
    .withMetadata({ exif: {}, icc: undefined })
    .toBuffer();
  fs.writeFileSync(file, buf);
  return { before, after: buf.length };
}

async function recompressJpg(file) {
  const input = fs.readFileSync(file);
  const before = input.length;
  const buf = await sharp(input)
    .jpeg({ quality: JPG_Q, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .withMetadata({ exif: {}, icc: undefined })
    .toBuffer();
  fs.writeFileSync(file, buf);
  return { before, after: buf.length };
}

async function run() {
  const files = [];
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    const subs = fs.readdirSync(root, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();
    for (const sub of subs) {
      const webp = path.join(root, sub, 'hero-640.webp');
      const jpg = path.join(root, sub, 'hero-640.jpg');
      if (fs.existsSync(webp)) files.push({ file: webp, kind: 'webp', root, sub });
      if (fs.existsSync(jpg)) files.push({ file: jpg, kind: 'jpg', root, sub });
    }
  }

  console.log(`Found ${files.length} files to recompress`);
  console.log(`Target: WebP q${WEBP_Q}, JPG q${JPG_Q}\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let idx = 0;

  for (const item of files) {
    idx++;
    const result = item.kind === 'webp'
      ? await recompressWebp(item.file)
      : await recompressJpg(item.file);
    totalBefore += result.before;
    totalAfter += result.after;
    const delta = result.before - result.after;
    const pct = result.before > 0 ? (delta / result.before * 100).toFixed(1) : '0.0';
    const tag = delta >= 0 ? '-' : '+';
    if (idx <= 20 || idx % 50 === 0 || idx === files.length) {
      console.log(`  [${idx}/${files.length}] ${item.kind.padEnd(4)} ${item.root}/${item.sub}/hero-640.${item.kind} ${(result.before/1024).toFixed(1)}K → ${(result.after/1024).toFixed(1)}K (${tag}${Math.abs(delta/1024).toFixed(1)}K / ${pct}%)`);
    }
  }

  const totalDelta = totalBefore - totalAfter;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Files recompressed: ${files.length}`);
  console.log(`Total before: ${(totalBefore/1024/1024).toFixed(2)} MB`);
  console.log(`Total after:  ${(totalAfter/1024/1024).toFixed(2)} MB`);
  console.log(`Saved:        ${(totalDelta/1024/1024).toFixed(2)} MB (${(totalDelta/totalBefore*100).toFixed(1)}%)`);
  console.log(`Avg per file: ${(totalDelta/files.length/1024).toFixed(1)} KB`);
}

run().catch(e => { console.error(e); process.exit(1); });
