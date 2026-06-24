// scripts/wire-commercial-photos.mjs
// Injects a full-bleed background <picture> into the custom `.hero` of commercial
// failure-mode / brand-pillar pages, guarded by existsSync (MODE A when photo present,
// black fallback otherwise). Idempotent: skips files already wired.
// Usage: node scripts/wire-commercial-photos.mjs <category/page ...>

import fs from 'node:fs';

const pages = process.argv.slice(2);
if (!pages.length) { console.error('usage: node scripts/wire-commercial-photos.mjs <category/page ...>'); process.exit(1); }

const bgBlock = (`<section class={heroPhoto ? "hero hero--photo" : "hero"}>
  {heroPhoto && (
    <div class="hero-bg">
      <picture>
        <source media="(max-width: 640px)" type="image/webp" srcset={` + '`${heroBase}/hero-640.webp`' + `} />
        <source media="(max-width: 640px)" type="image/jpeg" srcset={` + '`${heroBase}/hero-640.jpg`' + `} />
        <source media="(max-width: 960px)" type="image/webp" srcset={` + '`${heroBase}/hero-960.webp`' + `} />
        <source media="(max-width: 960px)" type="image/jpeg" srcset={` + '`${heroBase}/hero-960.jpg`' + `} />
        <source type="image/webp" srcset={` + '`${heroBase}/hero.webp`' + `} />
        <img src={` + '`${heroBase}/hero.jpg`' + `} alt="Commercial kitchen equipment repair — Southern California" width="1920" height="840" loading="eager" fetchpriority="high" />
      </picture>
      <div class="hero-overlay"></div>
    </div>
  )}`);

const cssBlock = `
  .hero--photo { position: relative; overflow: hidden; }
  .hero--photo .container { position: relative; z-index: 2; }
  .hero-bg { position: absolute; inset: 0; z-index: 0; }
  .hero-bg picture, .hero-bg img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(100deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.80) 32%, rgba(10,10,10,0.45) 62%, rgba(10,10,10,0.30) 100%); }`;

let wired = 0, skipped = 0, failed = 0;
for (const p of pages) {
  const file = `src/pages/commercial/${p}.astro`;
  if (!fs.existsSync(file)) { console.error(`MISSING: ${file}`); failed++; continue; }
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('hero--photo')) { console.log(`skip (already wired): ${p}`); skipped++; continue; }
  if (!s.includes('<section class="hero">')) { console.error(`NO .hero section: ${p}`); failed++; continue; }
  if (!/\.hero \{ background: var\(--black\)/.test(s)) { console.error(`NO .hero black CSS: ${p}`); failed++; continue; }

  // 1. existsSync import after Layout import
  if (!s.includes("from 'node:fs'")) {
    s = s.replace(/(import Layout from ['"][^'"]+['"];)/, `$1\nimport { existsSync } from 'node:fs';`);
  }
  // 2. frontmatter consts after existsSync import
  const constBlock = `\nconst heroSlug = '${p}';\nconst heroPhoto = existsSync(\`public/images/commercial/\${heroSlug}/hero.webp\`) && existsSync(\`public/images/commercial/\${heroSlug}/hero.jpg\`);\nconst heroBase = \`/images/commercial/\${heroSlug}\`;`;
  s = s.replace(/(import \{ existsSync \} from 'node:fs';)/, `$1${constBlock}`);
  // 3. markup
  s = s.replace('<section class="hero">', bgBlock);
  // 4. CSS after the .hero black rule
  s = s.replace(/(\.hero \{ background: var\(--black\)[^}]*\})/, `$1${cssBlock}`);

  fs.writeFileSync(file, s);
  console.log(`wired: ${p}`);
  wired++;
}
console.log(`\n=== wired ${wired}, skipped ${skipped}, failed ${failed} ===`);
if (failed) process.exit(1);
