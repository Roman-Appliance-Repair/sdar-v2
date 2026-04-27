#!/usr/bin/env node
// scripts/convert-service-photos.mjs
//
// Convert every .jpg in the homepage Services photo directories to a matching
// .webp at quality 82, preserving the original .jpg as a fallback. Idempotent —
// re-running skips files whose .webp already exists.
//
// Processes:
//   - public/images/services/       (residential, 4:5 portrait)
//   - public/images/comm-services/  (commercial,  4:3 landscape)
//
// Usage: node scripts/convert-service-photos.mjs

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const QUALITY = 82;
const SRC_DIRS = [
  { label: 'residential', dir: path.resolve('public/images/services') },
  { label: 'commercial',  dir: path.resolve('public/images/comm-services') },
];

let totalConverted = 0;
let totalSkipped = 0;

for (const { label, dir } of SRC_DIRS) {
  if (!fs.existsSync(dir)) {
    console.warn(`[${label}] directory not found, skipping: ${dir}`);
    continue;
  }

  const jpgs = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.jpg'));

  if (jpgs.length === 0) {
    console.log(`[${label}] no .jpg files found in ${dir}`);
    continue;
  }

  console.log(`\n[${label}] processing ${jpgs.length} file(s) in ${dir}`);

  for (const file of jpgs) {
    const jpgPath = path.join(dir, file);
    const webpPath = path.join(dir, file.replace(/\.jpg$/i, '.webp'));

    if (fs.existsSync(webpPath)) {
      totalSkipped++;
      continue;
    }

    await sharp(jpgPath).webp({ quality: QUALITY }).toFile(webpPath);

    const jpgKB = Math.round(fs.statSync(jpgPath).size / 1024);
    const webpKB = Math.round(fs.statSync(webpPath).size / 1024);
    console.log(`  [${label}] ${file} -> ${path.basename(webpPath)} (${jpgKB}KB -> ${webpKB}KB)`);
    totalConverted++;
  }
}

console.log(`\nDone — ${totalConverted} converted, ${totalSkipped} skipped (already existed).`);
