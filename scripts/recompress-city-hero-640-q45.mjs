import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// City-only hero-640 recompression at q45.
// Re-encodes from each city's original hero.webp master (1920w) down to
// 640w@q45 — single lossy pass, better quality than lossy-on-lossy
// recompression of the existing q55 variant.
//
// Visual review on 3 worst-offender cities (los-feliz, san-marino,
// toluca-lake) cleared q45 with no banding/blocking concerns. Expected
// avg savings ~15-16% vs current q55 sweep (commit cb38b91).
//
// Only affects /public/images/cities/*/hero-640.webp. Non-city heroes
// (commercial/services/outdoor) stay at q55 — their photographic content
// has lower variance and the gap to cities is intrinsic, not compression.

const CITIES_DIR = 'public/images/cities';
const TARGET_QUALITY = 45;

async function recompress(src, dst) {
  const before = fs.existsSync(dst) ? fs.statSync(dst).size : 0;
  const masterBuf = fs.readFileSync(src);
  const buf = await sharp(masterBuf)
    .resize(640, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: TARGET_QUALITY, effort: 6, smartSubsample: true })
    .withMetadata({ exif: {}, icc: undefined })
    .toBuffer();
  fs.writeFileSync(dst, buf);
  return { before, after: buf.length };
}

async function run() {
  const subs = fs.readdirSync(CITIES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  for (const city of subs) {
    const master = path.join(CITIES_DIR, city, 'hero.webp');
    const target = path.join(CITIES_DIR, city, 'hero-640.webp');

    if (!fs.existsSync(master)) {
      console.log(`SKIP ${city} — no master hero.webp`);
      continue;
    }

    const r = await recompress(master, target);
    totalBefore += r.before;
    totalAfter += r.after;
    count++;
    const delta = r.before - r.after;
    const pct = r.before > 0 ? (delta / r.before * 100).toFixed(1) : '0.0';
    console.log(`  [${count}/${subs.length}] ${city.padEnd(28)} ${(r.before/1024).toFixed(1)}K → ${(r.after/1024).toFixed(1)}K (−${(delta/1024).toFixed(1)}K / ${pct}%)`);
  }

  const delta = totalBefore - totalAfter;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Cities processed: ${count}`);
  console.log(`Total before:     ${(totalBefore/1024/1024).toFixed(2)} MB`);
  console.log(`Total after:      ${(totalAfter/1024/1024).toFixed(2)} MB`);
  console.log(`Saved:            ${(delta/1024/1024).toFixed(2)} MB (${(delta/totalBefore*100).toFixed(1)}%)`);
  console.log(`Avg per file:     ${(delta/count/1024).toFixed(1)} KB`);
}

run().catch(e => { console.error(e); process.exit(1); });
