// scripts/fix-logo-alpha.mjs
// Group 2 — the 4 brand logos saved opaque on a WHITE background render as a solid
// gold square under the hero gold filter (brightness(0)→black→gold fills everything).
// Fix: key out the white background into the alpha channel (alpha = non-whiteness ramp),
// keeping anti-aliased edges, so the gold filter colours only the mark. Overwrites the
// webp in place (lossless). Also creates a hyphen-named copy of "la cornue.webp" so it
// can be served without a space in the URL.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('public/brand-logos');

async function keyWhite(name) {
  const f = path.join(DIR, `${name}.webp`);
  const input = fs.readFileSync(f);   // read into memory first (avoid Windows file-handle lock on overwrite)
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const n = W * H;
  const rgb = Buffer.alloc(n * 3);
  const alpha = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
    rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b;
    const m = Math.min(r, g, b);               // 255 = white bg, 0 = black mark
    let a;
    if (m >= 245) a = 0;                        // background → transparent
    else if (m <= 200) a = 255;                // solid mark
    else a = Math.round((245 - m) / 45 * 255);  // anti-aliased edge ramp
    alpha[i] = a;
  }
  const buf = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } })
    .webp({ lossless: true })
    .toBuffer();
  fs.writeFileSync(f, buf);
  const kept = alpha.reduce((s, a) => s + (a > 0 ? 1 : 0), 0);
  console.log(`✓ ${name}: ${W}x${H} -> alpha added (${(kept / n * 100).toFixed(1)}% opaque pixels)`);
}

for (const name of ['rational', 'champion', 'kratos', 'mainstreet']) await keyWhite(name);

// hyphen copy for la-cornue (original file name has a space → bad in URLs)
const src = path.join(DIR, 'la cornue.webp');
const dst = path.join(DIR, 'la-cornue.webp');
if (fs.existsSync(src) && !fs.existsSync(dst)) { fs.copyFileSync(src, dst); console.log('✓ copied "la cornue.webp" -> la-cornue.webp'); }
console.log('done.');
