// scripts/gen-l3-heroes-v2.mjs — REDO L-3 heroes with brand-SIGNATURE-accurate design prompts.
// Research-informed detailed descriptions (air-gap precedent) so each range/appliance actually
// resembles the brand's design language — NOT a generic stainless box. NO-PEOPLE design-showcase
// (best for brand accuracy), varied premium kitchen per brand. Rules kept: NO readable brand
// names/logos/badges/model plates anywhere (design language yes, nameplate no). 21:9. Max 3
// content attempts; persistent fail -> flag (do NOT fall back). Places 6-file adaptive set,
// metadata stripped, webp tuned. Overwrites the prior generic files for these 9 slugs.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const RAW = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/31bd7613-2ca8-4be8-8011-0ca77ceb5972/scratchpad/l3-heroes-v2';
fs.mkdirSync(RAW, { recursive: true });

const NOTX = 'CRITICAL: absolutely NO readable brand name, NO logo, NO model-number plate, NO badge and NO text of any kind anywhere in the image — show the design language and materials only, never a nameplate.';
const RIGHT = 'The appliance is the hero, placed in the RIGHT two-thirds of the frame, sharp focus, beautifully lit. The LEFT ~40 percent is clean simple background — a plain wall or empty counter, negative space, no people.';
const STYLE = ' Ultra-wide 21:9 cinematic architectural-photography hero shot, photorealistic, warm natural lighting, high-end interiors magazine look, NOT AI-glossy, no people. 2K.';

const P = {
  // ultra-premium French / Italian ranges — design signatures
  'lacanche-range-repair':
    `A French Lacanche-style freestanding range as the centerpiece of a warm French country kitchen: a deeply colored glossy porcelain-enamel body (rich burgundy red or deep blue) with polished solid-brass trim rings, brass rails and brass-handled oven doors, heavy black cast-iron burner grates on top, a solid brass simmer plate. Rustic stone or plaster walls, copper pans. ${RIGHT} ${NOTX}`,
  'la-cornue-range-repair':
    `A grand bespoke French La Cornue-style Château range in a luxury estate kitchen: a large range with an iconic domed vaulted rounded-top oven, gleaming polished-brass trim, brass rivets and brass rails over deep glossy black or colored enamel, ornate metalwork, a bull-nose brass rail. Marble counters, refined cabinetry. ${RIGHT} ${NOTX}`,
  'officine-gullo-range-repair':
    `A hand-fabricated Italian Officine Gullo-style Florentine professional range in an opulent kitchen: brushed and riveted stainless-steel panels combined with solid polished-brass knobs, brass rails and brass framing, very heavy high-output burners, an integrated backsplash. Rich marble, warm brass accents throughout. ${RIGHT} ${NOTX}`,
  'fulgor-milano-repair':
    `A modern Italian Fulgor-Milano-style professional dual-fuel range in a sleek contemporary Italian kitchen: clean brushed-stainless body, substantial machined metal control knobs in a row, edge-to-edge continuous cast-iron grates, a large glass oven door. Minimalist handleless cabinets, quartz counters. ${RIGHT} ${NOTX}`,
  'fivestar-range-repair':
    `An American FiveStar-style commercial-grade stainless pro range in a transitional kitchen: robust stainless-steel body, open high-BTU sealed burners with heavy cast grates, chunky metal knobs, a thick handle bar across the oven door, backguard. Subway-tile backsplash, butcher-block counter. ${RIGHT} ${NOTX}`,
  'forno-range-repair':
    `A value Italian-styled Forno-style freestanding stainless range in a bright modern kitchen: stainless body with red or black accent control knobs, sealed gas burners with cast-iron grates, a large glass oven window, pro-look handle. Clean white cabinets, light counters. ${RIGHT} ${NOTX}`,
  // retro
  'elmira-stove-works-repair':
    `A 1950s-retro Northstar-style range in a cheerful vintage-styled kitchen: a rounded pastel porcelain-enamel body (mint green or buttercream) with bright chrome trim, chrome-ringed control dials, a curved chrome oven handle, retro clock-style panel with no text, whitewall-tire aesthetic. Checkerboard floor, retro diner vibe. ${RIGHT} ${NOTX}`,
  'heartland-appliance-repair':
    `A vintage-classic-styled Heartland-style enameled range in a farmhouse kitchen: a nostalgic cream or deep-red porcelain-enamel body with polished chrome accents, decorative chrome trim, curved legs, a warming shelf, classic rounded lines evoking early-1900s stove heritage. Wood cabinets, cottage feel. ${RIGHT} ${NOTX}`,
  // outdoor refrigeration
  'true-residential-outdoor-refrigerator-repair':
    `A commercial-grade stainless-steel undercounter outdoor refrigerator built into a stone BBQ island on a sunny Southern-California backyard patio: heavy 300-series brushed-stainless door, a solid pro-grade handle, forced-air vent grille at the base, glossy dew on the steel. Flagstone, potted olive trees, blue sky. No people. ${RIGHT} ${NOTX}`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}

async function gen(rawPath, prompt){
  const body=JSON.stringify({contents:[{parts:[{text:prompt+STYLE}]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'21:9'}}});
  let content=0;
  for(let a=1;a<=14 && content<3;a++){
    let resp;try{resp=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body});}catch(e){console.error('  net',e.message);await sleep(4000);continue;}
    if([429,500,503].includes(resp.status)){const t=await resp.text();const m=t.match(/retry in ([\d.]+)s/i);const w=m?Math.ceil(parseFloat(m[1])*1000)+1500:9000;console.error(`  HTTP ${resp.status} wait ${Math.round(w/1000)}s`);await sleep(w);continue;}
    const j=await resp.json(); content++;
    if(resp.status!==200){console.error('  HTTP',resp.status,j?.error?.message);await sleep(3000);continue;}
    const img=(j?.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData)?.inlineData;
    if(!img){console.error('  no image fr=',j?.candidates?.[0]?.finishReason,'(try',content+')');await sleep(3000);continue;}
    fs.writeFileSync(rawPath,Buffer.from(img.data,'base64'));
    if(!validPng(rawPath)){console.error('  bad png (try',content+')');await sleep(2000);continue;}
    return true;
  }
  return false;
}
async function place(rawPath, slug){
  const dir=path.join('public','images','brands',slug);
  fs.mkdirSync(dir,{recursive:true});
  for(const [w,name] of [[1920,'hero'],[960,'hero-960'],[640,'hero-640']]){
    const h=Math.round(w*9/21);
    const q=w===1920?74:(w===960?70:68);
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).webp({quality:q}).toFile(path.join(dir,`${name}.webp`));
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).jpeg({quality:82,mozjpeg:true}).toFile(path.join(dir,`${name}.jpg`));
  }
  return (fs.statSync(path.join(dir,'hero.webp')).size/1024).toFixed(0);
}

const only=process.argv[2];
const slugs=Object.keys(P).filter(s=>!only||s===only);
const done=[],failed=[];
for(const slug of slugs){
  const raw=path.join(RAW,`${slug}.png`);
  process.stdout.write(`gen ${slug} ... `);
  const ok=await gen(raw,P[slug]);
  console.log(ok?'ok':'FAIL');
  if(!ok){failed.push(slug);continue;}
  const kb=await place(raw,slug);
  console.log(`✓ placed ${slug} (hero.webp ${kb}KB)`);
  done.push(slug);
  await sleep(1200);
}
console.log(`\nDONE v2: placed=${done.length} failed=${failed.length}`);
if(failed.length) console.log('FAILED (flag, NO fallback):', failed.join(', '));
