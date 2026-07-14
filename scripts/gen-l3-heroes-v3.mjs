// scripts/gen-l3-heroes-v3.mjs — replace the 11 PRIOR-WAVE generic-technician L-3 heroes with
// brand-signature-accurate images (same render path/files, only the image CONTENT changes).
// Proven: render construct is identical to the working officine-gullo page; the visible
// "3-techs default" was the prior-wave image CONTENT (EXIF-tagged), not a layout fallback.
// Rules: no readable brands/logos/text, no-people design showcase, varied premium/commercial
// setting per brand, 21:9. ≤3 attempts, persistent fail -> flag. 6-file adaptive set,
// metadata stripped (proves regeneration), webp tuned.
import fs from 'node:fs'; import path from 'node:path'; import sharp from 'sharp';
const KEY=fs.readFileSync('secrets/gemini-key.txt','utf8').trim();
const URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const RAW='C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/31bd7613-2ca8-4be8-8011-0ca77ceb5972/scratchpad/l3-heroes-v3';
fs.mkdirSync(RAW,{recursive:true});
const NOTX='CRITICAL: absolutely NO readable brand name, NO logo, NO model-number plate, NO badge and NO text anywhere — design language and materials only, never a nameplate.';
const RIGHT='The appliance is the hero in the RIGHT two-thirds, sharp focus, beautifully lit. LEFT ~40 percent is clean plain background, negative space, no people.';
const STYLE=' Ultra-wide 21:9 cinematic architectural-photography hero shot, photorealistic, warm natural lighting, interiors-magazine look, NOT AI-glossy, no people. 2K.';
const P={
  'ge-monogram': `A luxury American professional stainless-steel built-in range in an upscale modern kitchen: heavy-gauge brushed stainless, bold commercial-style tubular handle, chunky precision metal control knobs in a row, edge-to-edge cast-iron grates, an integrated backsplash. Refined marble counters, warm cabinetry. ${RIGHT} ${NOTX}`,
  'signature-kitchen-suite': `A pro-luxury built-in dual-fuel range in a sleek high-end kitchen: sophisticated stainless with dark accents, a wide oven with a large glass door, heavy machined knobs, integrated sous-vide-style zone on the cooktop, seamless built-in look. Minimalist handleless cabinetry, quartz. ${RIGHT} ${NOTX}`,
  'hestan': `A hand-built professional range in a striking bold color (deep marine blue or vivid yellow) with brushed-stainless trim and solid metal knobs, heavy high-output burners with cast grates, in a design-forward luxury kitchen. Colorful statement piece, marble island. ${RIGHT} ${NOTX}`,
  'cove': `A premium built-in dishwasher with its door open in a luxury kitchen, revealing polished stainless-steel interior tub, tidy stainless racks, and a cutlery tray — panel-ready flush-cabinet look on the door front. Clean, refined, integrated cabinetry, stone counters. ${RIGHT} ${NOTX}`,
  'american-range-repair': `An American commercial-grade stainless professional range in a transitional home kitchen: robust brushed stainless, open high-BTU burners with heavy cast-iron grates, a thick handle bar, a high stainless backguard. Subway tile, butcher-block. ${RIGHT} ${NOTX}`,
  'bluestar': `An open-burner professional range in a vivid custom color (bright red or cobalt blue) porcelain-enamel body with stainless trim, distinctive star-shaped open gas burners with cast-iron grates, heavy metal knobs, in a colorful design-forward kitchen. ${RIGHT} ${NOTX}`,
  'garland': `A heavy-duty stainless commercial restaurant range line in a professional stainless-steel commercial kitchen: a long row of high-BTU open burners with cast-iron grates, thick stainless body, a commercial oven below, backsplash and overshelf. Stainless prep tables, restaurant setting. ${RIGHT} ${NOTX}`,
  'big-chill-refrigerator-repair': `A bold retro-style refrigerator in a cheerful vintage-styled kitchen: a rounded glossy porcelain-enamel body in cherry-red (or pastel mint) with bright polished-chrome handle, hinges and trim, 1950s curves. Checkerboard floor, retro accents. ${RIGHT} ${NOTX}`,
  'perlick-commercial': `A commercial-grade stainless-steel undercounter back-bar refrigerator built into a sleek bar: heavy brushed-stainless door with a solid pro handle, forced-air vent grille, glossy steel, glass rack above. Dim upscale bar setting, bottles softly out of focus. ${RIGHT} ${NOTX}`,
  'u-line': `A built-in stainless undercounter refrigeration unit in a modern luxury kitchen island: a flush brushed-stainless door with a clean bar handle, integrated into cabinetry, subtle vent grille at the base. Quartz waterfall counter, warm wood cabinets. ${RIGHT} ${NOTX}`,
  'true-residential-refrigerator-repair': `A commercial-grade full-height stainless-steel built-in refrigerator column in a luxury kitchen: heavy 300-series brushed-stainless door, a solid pro-grade tubular handle, flush with premium cabinetry, restaurant-grade look brought home. Marble, refined interior. ${RIGHT} ${NOTX}`,
};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}
async function gen(rawPath,prompt){
  const body=JSON.stringify({contents:[{parts:[{text:prompt+STYLE}]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'21:9'}}});
  let c=0;
  for(let a=1;a<=16&&c<3;a++){
    let resp;try{resp=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body});}catch(e){console.error('  net',e.message);await sleep(4000);continue;}
    if([429,500,503].includes(resp.status)){const t=await resp.text();const m=t.match(/retry in ([\d.]+)s/i);const w=m?Math.ceil(parseFloat(m[1])*1000)+1500:9000;console.error(`  HTTP ${resp.status} wait ${Math.round(w/1000)}s`);await sleep(w);continue;}
    const j=await resp.json();c++;
    if(resp.status!==200){console.error('  HTTP',resp.status,j?.error?.message);await sleep(3000);continue;}
    const img=(j?.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData)?.inlineData;
    if(!img){console.error('  no image fr=',j?.candidates?.[0]?.finishReason);await sleep(3000);continue;}
    fs.writeFileSync(rawPath,Buffer.from(img.data,'base64'));
    if(!validPng(rawPath)){console.error('  bad png');await sleep(2000);continue;}
    return true;
  }
  return false;
}
async function place(rawPath,slug){
  const dir=path.join('public','images','brands',slug); fs.mkdirSync(dir,{recursive:true});
  for(const [w,name] of [[1920,'hero'],[960,'hero-960'],[640,'hero-640']]){
    const h=Math.round(w*9/21); const q=w===1920?72:(w===960?70:68);
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).webp({quality:q}).toFile(path.join(dir,`${name}.webp`));
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).jpeg({quality:82,mozjpeg:true}).toFile(path.join(dir,`${name}.jpg`));
  }
  return (fs.statSync(path.join(dir,'hero.webp')).size/1024).toFixed(0);
}
const only=process.argv[2]; const slugs=Object.keys(P).filter(s=>!only||s===only);
const done=[],failed=[];
for(const slug of slugs){
  process.stdout.write(`gen ${slug} ... `); const raw=path.join(RAW,`${slug}.png`);
  const ok=await gen(raw,P[slug]); console.log(ok?'ok':'FAIL');
  if(!ok){failed.push(slug);continue;}
  console.log(`✓ placed ${slug} (hero.webp ${await place(raw,slug)}KB)`); done.push(slug); await sleep(1200);
}
console.log(`\nDONE v3: placed=${done.length} failed=${failed.length}`); if(failed.length)console.log('FAILED (flag, no fallback):',failed.join(', '));
