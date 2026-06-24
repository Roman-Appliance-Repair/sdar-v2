// scripts/wire-commercial-brandhero.mjs
// Full-bleed photo wiring for the light `.brand-hero` layout (delfield / perlick).
// Adds a dark photo background + overlay and flips hero text to light, guarded by
// existsSync. Idempotent. Usage: node scripts/wire-commercial-brandhero.mjs <category/page ...>

import fs from 'node:fs';

const pages = process.argv.slice(2);
if (!pages.length) { console.error('usage: <category/page ...>'); process.exit(1); }

const bgBlock = (`<section class={heroPhoto ? "brand-hero brand-hero--photo" : "brand-hero"}>
    {heroPhoto && (
      <div class="hero-bg">
        <picture>
          <source media="(max-width: 640px)" type="image/webp" srcset={` + '`${heroBase}/hero-640.webp`' + `} />
          <source media="(max-width: 640px)" type="image/jpeg" srcset={` + '`${heroBase}/hero-640.jpg`' + `} />
          <source media="(max-width: 960px)" type="image/webp" srcset={` + '`${heroBase}/hero-960.webp`' + `} />
          <source media="(max-width: 960px)" type="image/jpeg" srcset={` + '`${heroBase}/hero-960.jpg`' + `} />
          <source type="image/webp" srcset={` + '`${heroBase}/hero.webp`' + `} />
          <img src={` + '`${heroBase}/hero.jpg`' + `} alt="Commercial refrigeration repair in a professional kitchen — Southern California" width="1920" height="840" loading="eager" fetchpriority="high" />
        </picture>
        <div class="hero-overlay"></div>
      </div>
    )}`);

const cssBlock = `
.brand-hero--photo{position:relative;overflow:hidden;border-bottom:none}
.brand-hero--photo .hero-bg{position:absolute;inset:0;z-index:0}
.brand-hero--photo .hero-bg picture,.brand-hero--photo .hero-bg img{width:100%;height:100%;object-fit:cover;display:block}
.brand-hero--photo .hero-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(100deg,rgba(10,10,10,0.92) 0%,rgba(10,10,10,0.80) 34%,rgba(10,10,10,0.48) 64%,rgba(10,10,10,0.30) 100%)}
.brand-hero--photo .hero-inner{position:relative;z-index:2}
.brand-hero--photo h1{color:#fff}
.brand-hero--photo .hero-sub,.brand-hero--photo .hero-trust{color:rgba(255,255,255,0.85)}`;

let wired = 0, failed = 0;
for (const p of pages) {
  const file = `src/pages/commercial/${p}.astro`;
  if (!fs.existsSync(file)) { console.error(`MISSING: ${file}`); failed++; continue; }
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('brand-hero--photo')) { console.log(`skip (wired): ${p}`); continue; }
  if (!s.includes('<section class="brand-hero">')) { console.error(`NO .brand-hero: ${p}`); failed++; continue; }

  if (!s.includes("from 'node:fs'")) {
    s = s.replace(/(import Layout from ['"][^'"]+['"];)/, `$1\nimport { existsSync } from 'node:fs';`);
  }
  const constBlock = `\nconst heroSlug = '${p}';\nconst heroPhoto = existsSync(\`public/images/commercial/\${heroSlug}/hero.webp\`) && existsSync(\`public/images/commercial/\${heroSlug}/hero.jpg\`);\nconst heroBase = \`/images/commercial/\${heroSlug}\`;`;
  s = s.replace(/(import \{ existsSync \} from 'node:fs';)/, `$1${constBlock}`);
  s = s.replace('<section class="brand-hero">', bgBlock);
  s = s.replace(/(\.brand-hero\{background:var\(--color-bg\)[^}]*\})/, `$1${cssBlock}`);

  fs.writeFileSync(file, s);
  console.log(`wired: ${p}`);
  wired++;
}
console.log(`\n=== wired ${wired}, failed ${failed} ===`);
if (failed) process.exit(1);
