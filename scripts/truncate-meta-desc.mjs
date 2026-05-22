// scripts/truncate-meta-desc.mjs
//
// Applies 18 meta-description truncations approved by Roman 2026-05-09.
// Each entry is { file, old, new }. OLD must match exactly once; NEW
// preserves quote style (template literal vs double-quoted).
//
// Run: node scripts/truncate-meta-desc.mjs
// Idempotent — second run reports no changes.

import fs from 'fs';

const edits = [
  {
    file: 'src/pages/rancho-cucamonga.astro',
    old: 'const description = `Same-day appliance repair in Rancho Cucamonga. Refrigerator, washer, dryer, oven & more. Sub-Zero, Samsung, LG, Whirlpool. Licensed. OEM parts. Call ${phone}.`;',
    new: 'const description = `Same-day appliance repair in Rancho Cucamonga. Refrigerator, washer, dryer, oven & more. Sub-Zero, Samsung, LG, Whirlpool. Licensed. OEM parts.`;'
  },
  {
    file: 'src/pages/price-list/commercial-exhaust-hood-repair-cost.astro',
    old: 'const description = "Commercial exhaust hood repair cost — fan motor, VFD, make-up air, fire suppression linkage, grease duct cleaning. Captive-Aire, Halton, Greenheck, Gaylord. Labor from $200. $120 dx.";',
    new: 'const description = "Commercial exhaust hood repair cost — fan motor, VFD, make-up air, fire suppression linkage, grease duct cleaning. Captive-Aire, Halton, Greenheck, Gaylord.";'
  },
  {
    file: 'src/pages/contact.astro',
    old: "const description = 'Contact Same Day Appliance Repair — 8 branches across LA, Orange, Ventura, San Bernardino, Riverside counties. BHGS #A49573, BBB Accredited, CSLB C-20, EPA 608. Call or book online.';",
    new: "const description = 'Contact Same Day Appliance Repair — 8 branches across LA, Orange, Ventura, San Bernardino, Riverside counties. BHGS #A49573, EPA 608, BBB Accredited.';"
  },
  {
    file: 'src/pages/commercial/steamer-repair/brands/market-forge.astro',
    old: 'const description = `Market Forge commercial steamer repair. LA same-day. M24, M36, ETP electric, EnergyMizer pressureless. Welbilt brand since 1893. $120 commercial. ${phone}.`;',
    new: 'const description = `Market Forge commercial steamer repair. LA same-day. M24, M36, ETP electric, EnergyMizer pressureless. Welbilt brand since 1893. $120 commercial.`;'
  },
  {
    file: 'src/pages/services/refrigerator-repair/freezer-side-issues.astro',
    old: 'const description = `Freezer not freezing, frost on back wall, ice cream soft, freezer too cold? LA same-day. Defrost system, door seal, evap fan, sensor. BHGS #A49573. ${phone}.`;',
    new: 'const description = `Freezer not freezing, frost on back wall, ice cream soft, freezer too cold? LA same-day. Defrost system, door seal, evap fan, sensor. BHGS #A49573.`;'
  },
  {
    file: 'src/pages/brands/vinotemp.astro',
    old: 'const description = "Vinotemp wine cooler and custom cellar repair across LA. Mirrored, ProTech, Connoisseur series. Custom cellar systems integrating CellarPro/WhisperKool. EPA 608, $89 dx.";',
    new: 'const description = "Vinotemp wine cooler and custom cellar repair across LA. Mirrored, ProTech, Connoisseur series. Custom cellar systems integrating CellarPro/WhisperKool.";'
  },
  {
    file: 'src/pages/brands/cellarpro.astro',
    old: 'const description = "CellarPro wine cellar cooling repair across LA. 1800/3000/3200/4200 series + Mini-Split. EPA 608 + BHGS licensed. Service any-age units including pre-2010 legacy.";',
    new: 'const description = "CellarPro wine cellar cooling repair across LA. 1800/3000/3200/4200 series + Mini-Split. EPA 608 + BHGS licensed. Service any-age units.";'
  },
  {
    file: 'src/pages/commercial/steamer-repair/brands/groen.astro',
    old: 'const description = `Groen commercial steamer repair. LA same-day. HyperSteam pressureless, ConvectionSteamer, Smart-Steam, SSB-series. Ali Group brand. $120 commercial. ${phone}.`;',
    new: 'const description = `Groen commercial steamer repair. LA same-day. HyperSteam pressureless, ConvectionSteamer, Smart-Steam, SSB-series. Ali Group brand. $120 commercial.`;'
  },
  {
    file: 'src/pages/brands/wine-enthusiast-wine-cooler.astro',
    old: 'const description = "Wine Enthusiast wine cooler repair across LA. Silent Series thermoelectric, Classic Wood, VinoView. Premium tier vs entry-tier honest split. EPA 608, $89 dx waived with repair.";',
    new: 'const description = "Wine Enthusiast wine cooler repair across LA. Silent Series thermoelectric, Classic Wood, VinoView. Premium tier vs entry-tier honest split. EPA 608, $89 dx.";'
  },
  {
    file: 'src/pages/brands/le-cache.astro',
    old: 'const description = "Le Cache wine cabinet repair across LA. Contemporary, Mission, Vista series. Breezaire and CellarPro cooling units serviced. Handcrafted hardwood. EPA 608, $89 dx.";',
    new: 'const description = "Le Cache wine cabinet repair across LA. Contemporary, Mission, Vista series. Breezaire and CellarPro cooling units serviced. Handcrafted hardwood. EPA 608.";'
  },
  {
    file: 'src/pages/services/range-hood-repair/not-venting.astro',
    old: 'const description = `Range hood fan runs but no suction, smoke not clearing? LA same-day. Motor, capacitor, ductwork blockage, charcoal filter, makeup air. BHGS #A49573. ${phone}.`;',
    new: 'const description = `Range hood fan runs but no suction, smoke not clearing? LA same-day. Motor, capacitor, ductwork blockage, charcoal filter, makeup air. BHGS #A49573.`;'
  },
  {
    file: 'src/pages/brands/traulsen.astro',
    old: 'const description = "Traulsen reach-in refrigerator + freezer repair across LA, OC, Ventura, SB, Riverside. G-Series, R-Series, RHT specification, prep tables. EPA 608, $120 commercial dx.";',
    new: 'const description = "Traulsen reach-in refrigerator + freezer repair across LA, OC, Ventura, SB, Riverside. G-Series, R-Series, RHT specification, prep tables. EPA 608.";'
  },
  {
    file: 'src/pages/brands/broan.astro',
    old: 'const description = "Broan range hood repair across LA. 40000/41000 Series, Allure, Evolution, Best by Broan + legacy NuTone. Volume property manager service. EPA 608 + BHGS licensed.";',
    new: 'const description = "Broan range hood repair across LA. 40000/41000 Series, Allure, Evolution, Best by Broan + legacy NuTone. Volume property manager service. EPA 608.";'
  },
  {
    file: 'src/pages/commercial/mixer-repair/brands/univex.astro',
    old: 'const description = `Univex commercial mixer repair. LA same-day. SRMF spiral, M-Series planetary, dough divider. Independent New Hampshire since 1948. $120 commercial. ${phone}.`;',
    new: 'const description = `Univex commercial mixer repair. LA same-day. SRMF spiral, M-Series planetary, dough divider. Independent New Hampshire since 1948. $120 commercial.`;'
  },
  {
    file: 'src/pages/commercial/kettle-repair/brands/groen.astro',
    old: 'const description = `Groen steam jacketed kettle repair across SoCal. TDB-40 / 60 / 80, AH-1E electric, ABC braising pans. Ali Group portfolio. $120 commercial diagnostic. ${phone}.`;',
    new: 'const description = `Groen steam jacketed kettle repair across SoCal. TDB-40 / 60 / 80, AH-1E electric, ABC braising pans. Ali Group portfolio. $120 commercial diagnostic.`;'
  },
  {
    file: 'src/pages/brands/summit-wine-cooler.astro',
    old: 'const description = "Summit wine cooler repair across LA. Commercial-grade SCR + undercounter SWC + Vinotique luxury sub-line. Felix Storch Inc since 1968. EPA 608, $89 dx waived with repair.";',
    new: 'const description = "Summit wine cooler repair across LA. Commercial-grade SCR + undercounter SWC + Vinotique luxury sub-line. Felix Storch Inc since 1968. EPA 608, $89 dx.";'
  },
  {
    file: 'src/pages/brands/danby-wine-cooler.astro',
    old: 'const description = "Danby wine cooler repair across LA. Silhouette Professional commercial-grade, Silhouette consumer, Designer entry-tier. Marshall family Canadian heritage 1947. EPA 608, $89 dx.";',
    new: 'const description = "Danby wine cooler repair across LA. Silhouette Professional commercial-grade, Silhouette consumer, Designer entry-tier. Marshall family Canadian heritage 1947.";'
  },
  {
    file: 'src/pages/commercial/fryer-repair/temperature-recovery-slow.astro',
    old: 'const description = `Fryer takes too long to recover after a basket drop? Burner cleaning, gas pressure, probe drift, oil quality, undersized infrastructure. $120 dx. ${phone}.`;',
    new: 'const description = `Fryer takes too long to recover after a basket drop? Burner cleaning, gas pressure, probe drift, oil quality, undersized infrastructure. $120 dx.`;'
  }
];

let applied = 0;
let skipped = 0;
const failures = [];

for (const { file, old, new: newStr } of edits) {
  if (!fs.existsSync(file)) {
    failures.push({ file, reason: 'FILE NOT FOUND' });
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes(newStr) && !src.includes(old)) {
    skipped++;
    console.log('  SKIP (already applied)  ' + file);
    continue;
  }
  if (!src.includes(old)) {
    failures.push({ file, reason: 'OLD NOT FOUND — manual review needed' });
    continue;
  }
  // count occurrences of old
  const occurrences = src.split(old).length - 1;
  if (occurrences > 1) {
    failures.push({ file, reason: 'OLD matched ' + occurrences + ' times — ambiguous' });
    continue;
  }
  const updated = src.replace(old, newStr);
  fs.writeFileSync(file, updated, 'utf8');
  applied++;
  console.log('  APPLIED                 ' + file);
}

console.log('\nApplied: ' + applied + ' / ' + edits.length);
console.log('Skipped (idempotent): ' + skipped);
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(({ file, reason }) => console.log('  ' + reason + '  ' + file));
  process.exit(1);
}
