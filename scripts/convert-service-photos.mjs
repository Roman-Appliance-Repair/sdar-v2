#!/usr/bin/env node
// scripts/convert-service-photos.mjs
//
// Convert every .jpg in public/images/services/ to a matching .webp at
// quality 82, preserving the original .jpg as a fallback. Idempotent —
// re-running skips files whose .webp already exists.
//
// Usage: node scripts/convert-service-photos.mjs

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = path.resolve('public/images/services');
const QUALITY = 82;

if (!fs.existsSync(SRC_DIR)) {
  console.error(`Source directory not found: ${SRC_DIR}`);
  process.exit(1);
}

const jpgs = fs.readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.jpg'));

if (jpgs.length === 0) {
  console.log('No .jpg files found — nothing to convert.');
  process.exit(0);
}

let converted = 0;
let skipped = 0;

for (const file of jpgs) {
  const jpgPath = path.join(SRC_DIR, file);
  const webpPath = path.join(SRC_DIR, file.replace(/\.jpg$/i, '.webp'));

  if (fs.existsSync(webpPath)) {
    skipped++;
    continue;
  }

  await sharp(jpgPath).webp({ quality: QUALITY }).toFile(webpPath);

  const jpgKB = Math.round(fs.statSync(jpgPath).size / 1024);
  const webpKB = Math.round(fs.statSync(webpPath).size / 1024);
  console.log(`Converted: ${file} -> ${path.basename(webpPath)} (${jpgKB}KB -> ${webpKB}KB)`);
  converted++;
}

console.log(`\nDone — ${converted} converted, ${skipped} skipped (already existed).`);
