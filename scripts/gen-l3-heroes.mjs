// scripts/gen-l3-heroes.mjs — generate + place hero images for the 9 L-3 luxury brand pages.
// Gemini 2.5-flash-image, 21:9. Rules: ultra-premium (lacanche/la-cornue/officine-gullo) =
// NO-PEOPLE premium range closeup; else EXACTLY ONE technician, subject RIGHT half; LEFT ~40%
// clean; NO readable brand/text. Max 2 content-retries per slug (429/503 backoff separate);
// persistent fail -> slug logged FAILED (page keeps text-hero). Places 6-file adaptive set
// public/images/brands/{slug}/ (hero + hero-960 + hero-640, webp+jpg), 1920 wide, metadata
// stripped (sharp default), webp tuned to 80-150KB.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const RAW = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/31bd7613-2ca8-4be8-8011-0ca77ceb5972/scratchpad/l3-heroes';
fs.mkdirSync(RAW, { recursive: true });

const LEFT = 'The LEFT ~40 percent of the frame is clean plain background — a wall or empty counter, negative space with nothing important and no people in it.';
const NOTX = 'Absolutely NO visible brand badge, NO model-number plate, NO readable brand name, logo or text anywhere.';
const ONE = 'EXACTLY ONE person in the whole frame — a single male appliance repair technician, alone; NO customer, NO second person, NO handshake, NO other people and NO body parts of anyone else anywhere including the far left edge, corners and background. Focused solo working pose, looking at his tool or the appliance, not at the camera.';
const STYLE = ' Ultra-wide 21:9 cinematic hero photograph, photorealistic candid documentary style, natural realistic lighting, NOT AI-glossy. COMPOSITION: main subject in the RIGHT third, sharp focus; LEFT ~40 percent clean plain background. Realistic natural hands, correct limb count. 2K.';

// prompt per slug
const P = {
  'lacanche-range-repair':
    `A macro close-up in the RIGHT half of a hand-built luxury French range in an upscale estate kitchen — polished brass burner rings and knob collars, deep glossy enameled steel, heavy cast burner grates, warm reflections. No people. ${LEFT} ${NOTX}`,
  'la-cornue-range-repair':
    `A macro close-up in the RIGHT half of a grand bespoke range in a luxury estate kitchen — a domed vaulted oven front, gleaming brass trim and rivets over deep colored enamel, ornate metalwork. No people. ${LEFT} ${NOTX}`,
  'officine-gullo-range-repair':
    `A macro close-up in the RIGHT half of a hand-fabricated stainless-and-brass professional Italian range in a very high-end kitchen — brushed steel panels, solid brass knobs and rails, heavy high-output burners. No people. ${LEFT} ${NOTX}`,
  'fulgor-milano-repair':
    `A single male appliance repair technician alone in the RIGHT third, kneeling at an open brand-neutral modern stainless range/oven, holding a multimeter to an internal control board, a service light and hand tools on a canvas mat. ${ONE} ${LEFT} ${NOTX}`,
  'fivestar-range-repair':
    `A single male appliance repair technician alone in the RIGHT third, servicing the sealed burners of an open brand-neutral stainless professional gas range, adjusting a burner with a tool, hand tools on a mat. ${ONE} ${LEFT} ${NOTX}`,
  'forno-range-repair':
    `A single male appliance repair technician alone in the RIGHT third, checking the oven igniter inside an open brand-neutral stainless freestanding range, a service light and multimeter nearby. ${ONE} ${LEFT} ${NOTX}`,
  'elmira-stove-works-repair':
    `A single male appliance repair technician alone in the RIGHT third, servicing a 1950s-retro-styled pastel enameled range with rounded chrome trim in a stylish kitchen, checking a burner with a tool. ${ONE} ${LEFT} ${NOTX}`,
  'heartland-appliance-repair':
    `A single male appliance repair technician alone in the RIGHT third, inspecting a vintage-retro-styled enameled range with chrome accents in a home kitchen, multimeter in hand. ${ONE} ${LEFT} ${NOTX}`,
  'true-residential-outdoor-refrigerator-repair':
    `A single male appliance repair technician alone in the RIGHT third, kneeling at an open stainless undercounter outdoor refrigerator built into a stone BBQ island on a sunny backyard patio, checking the condenser with a tool. ${ONE} ${LEFT} ${NOTX}`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}

async function gen(rawPath, prompt){
  const body=JSON.stringify({contents:[{parts:[{text:prompt+STYLE}]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'21:9'}}});
  let content=0; // content attempts (max 3 = 1 + 2 retries)
  for(let a=1;a<=12 && content<3;a++){
    let resp;try{resp=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body});}catch(e){console.error('  net',e.message);await sleep(4000);continue;}
    if([429,500,503].includes(resp.status)){const t=await resp.text();const m=t.match(/retry in ([\d.]+)s/i);const w=m?Math.ceil(parseFloat(m[1])*1000)+1500:9000;console.error(`  HTTP ${resp.status} wait ${Math.round(w/1000)}s`);await sleep(w);continue;}
    const j=await resp.json();
    content++;
    if(resp.status!==200){console.error('  HTTP',resp.status,j?.error?.message);await sleep(3000);continue;}
    const img=(j?.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData)?.inlineData;
    if(!img){console.error('  no image fr=',j?.candidates?.[0]?.finishReason,'(content try',content+')');await sleep(3000);continue;}
    fs.writeFileSync(rawPath,Buffer.from(img.data,'base64'));
    if(!validPng(rawPath)){console.error('  bad png (content try',content+')');await sleep(2000);continue;}
    return true;
  }
  return false;
}

async function place(rawPath, slug){
  const dir=path.join('public','images','brands',slug);
  fs.mkdirSync(dir,{recursive:true});
  const base=sharp(rawPath).rotate();
  const widths=[[1920,'hero'],[960,'hero-960'],[640,'hero-640']];
  for(const [w,name] of widths){
    const h=Math.round(w*9/21);
    // webp — tune quality toward 80-150KB on the 1920, smaller for adaptives
    const q = w===1920?72:(w===960?70:68);
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).webp({quality:q}).toFile(path.join(dir,`${name}.webp`));
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).jpeg({quality:82,mozjpeg:true}).toFile(path.join(dir,`${name}.jpg`));
  }
  const kb=(fs.statSync(path.join(dir,'hero.webp')).size/1024).toFixed(0);
  return kb;
}

const only = process.argv[2]; // optional single-slug filter
const slugs = Object.keys(P).filter(s=>!only||s===only);
const done=[], failed=[];
for(const slug of slugs){
  const placed=path.join('public','images','brands',slug,'hero.webp');
  if(fs.existsSync(placed) && fs.existsSync(path.join('public','images','brands',slug,'hero.jpg'))){console.log('· already placed, skip',slug);done.push(slug+'(cached)');continue;}
  const raw=path.join(RAW,`${slug}.png`);
  let ok = validPng(raw);
  if(!ok){ process.stdout.write(`gen ${slug} ... `); ok=await gen(raw,P[slug]); console.log(ok?'ok':'FAIL'); }
  if(!ok){ failed.push(slug); continue; }
  const kb=await place(raw,slug);
  console.log(`✓ placed ${slug} (hero.webp ${kb}KB)`);
  done.push(slug);
  await sleep(1200);
}
console.log(`\nDONE: placed=${done.length} failed=${failed.length}`);
console.log('placed:', done.join(', ')||'(none)');
if(failed.length) console.log('FAILED (text-hero, flag):', failed.join(', '));
