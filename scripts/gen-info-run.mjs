// scripts/gen-info-run.mjs — full-run hero generation for info pages (services + outdoor).
// Hardened: composition (subject RIGHT, left 40% clean), EXACTLY ONE person / no interaction,
// brand-neutral, no readable text. Skips slugs that already have a placed hero (idempotent).
// Usage: node scripts/gen-info-run.mjs <clusterFilter>   e.g. "dishwasher-repair" | "outdoor" | "all"
import fs from 'node:fs';
import path from 'node:path';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/37029127-59b9-434c-a4f3-05f246308347/scratchpad/run';
fs.mkdirSync(OUTDIR, { recursive: true });
const FILTER = process.argv[2] || 'all';

const PAGES = `
outdoor/grill-repair/not-getting-hot
outdoor/smoker-repair/traeger-error-codes
services/dishwasher-repair/air-gap
services/dishwasher-repair/bosch-e15-error
services/dishwasher-repair/bosch-error-codes
services/dishwasher-repair/bosch-not-draining
services/dishwasher-repair/frigidaire-not-draining
services/dishwasher-repair/ge-not-draining
services/dishwasher-repair/how-long-do-dishwashers-last
services/dishwasher-repair/kenmore-not-draining
services/dishwasher-repair/kitchenaid-not-draining
services/dishwasher-repair/lg-error-codes
services/dishwasher-repair/maytag-not-draining
services/dishwasher-repair/not-drying
services/dishwasher-repair/samsung-not-draining
services/dishwasher-repair/whirlpool-error-codes
services/dishwasher-repair/whirlpool-not-cleaning
services/dishwasher-repair/whirlpool-not-draining
services/dishwasher-repair/whirlpool-not-drying
services/dryer-repair/amana-not-heating
services/dryer-repair/error-codes
services/dryer-repair/ge-not-heating
services/dryer-repair/how-long-do-dryers-last
services/dryer-repair/kenmore-not-heating
services/dryer-repair/lg-d80-error
services/dryer-repair/lg-not-heating
services/dryer-repair/maytag-not-heating
services/dryer-repair/samsung-not-heating
services/dryer-repair/speed-queen-not-heating
services/dryer-repair/squeaking
services/dryer-repair/whirlpool-not-heating
services/freezer-repair/frigidaire-not-freezing
services/freezer-repair/ice-buildup
services/freezer-repair/lg-not-freezing
services/freezer-repair/not-freezing
services/ice-maker-repair/not-making-ice
services/ice-maker-repair/samsung-ice-maker-not-working
services/microwave-repair/lg-not-heating
services/microwave-repair/samsung-not-heating
services/oven-repair/error-codes
services/oven-repair/samsung-not-heating
services/oven-repair/whirlpool-not-heating
services/refrigerator-repair/amana-not-cooling
services/refrigerator-repair/fridge-not-cooling-freezer-works
services/refrigerator-repair/frigidaire-ice-maker-not-working
services/refrigerator-repair/frigidaire-not-cooling
services/refrigerator-repair/ge-ice-maker-not-working
services/refrigerator-repair/ge-not-cooling
services/refrigerator-repair/how-long-do-refrigerators-last
services/refrigerator-repair/kenmore-ice-maker-not-working
services/refrigerator-repair/kenmore-not-cooling
services/refrigerator-repair/kitchenaid-not-cooling
services/refrigerator-repair/lg-error-codes
services/refrigerator-repair/lg-ice-maker-not-working
services/refrigerator-repair/lg-not-cooling
services/refrigerator-repair/maytag-not-cooling
services/refrigerator-repair/samsung-error-codes
services/refrigerator-repair/samsung-not-cooling
services/refrigerator-repair/sub-zero-problems-by-series
services/refrigerator-repair/whirlpool-ice-maker-not-working
services/refrigerator-repair/whirlpool-not-cooling
services/washer-repair/ge-error-codes
services/washer-repair/ge-not-spinning
services/washer-repair/how-long-do-washers-last
services/washer-repair/lg-error-codes
services/washer-repair/maytag-error-codes
services/washer-repair/maytag-not-draining
services/washer-repair/samsung-error-codes
services/washer-repair/samsung-not-spinning
services/washer-repair/whirlpool-error-codes
services/washer-repair/whirlpool-not-draining
`.trim().split('\n');

const BRANDS = ['speed-queen','sub-zero','kitchenaid','frigidaire','whirlpool','samsung','maytag','kenmore','amana','bosch','traeger','lg','ge'];
const APPL = { 'dishwasher-repair':'dishwasher','dryer-repair':'dryer','refrigerator-repair':'refrigerator','freezer-repair':'freezer','ice-maker-repair':'ice maker','washer-repair':'washing machine','oven-repair':'oven','microwave-repair':'microwave','grill-repair':'gas grill','smoker-repair':'pellet smoker' };
const APPEAR = ['a man in his 30s, short dark hair','a man in his 40s with a short beard','a man in his 30s wearing glasses'];

function brandOf(slug){ for(const b of BRANDS){ if(slug.startsWith(b+'-')||slug===b) return b; } return null; }
function topicOf(slug){ if(slug.includes('how-long-do'))return'lifespan'; if(slug.includes('problems-by-series'))return'reference'; if(slug.includes('air-gap'))return'component'; if(slug.endsWith('error-codes')||slug.includes('-error')||slug.endsWith('d80-error')||slug==='error-codes')return'codes'; return'symptom'; }
function tmplOf(a,topic,slug){
  if(topic==='lifespan')return'T7'; if(topic==='reference')return'T5';
  if(a==='dishwasher'){ if(slug.includes('air-gap'))return'R'; if(slug.includes('not-draining'))return'T3'; if(slug.includes('not-drying'))return'Cdry'; if(slug.includes('not-cleaning'))return'Ccln'; if(topic==='codes')return'T2'; return'T1'; }
  if(a==='washing machine'){ if(slug.includes('not-draining'))return'T3'; if(slug.includes('not-spinning'))return'T1'; if(topic==='codes')return'T2'; return'T1'; }
  if(a==='dryer'){ if(slug.includes('squeaking'))return'Csqk'; if(slug.includes('not-heating'))return'T4'; if(topic==='codes')return'T2'; return'T1'; }
  if(a==='refrigerator'||a==='freezer'){ if(slug.includes('ice-maker')||slug.includes('ice-buildup')||slug.includes('not-making-ice'))return'T6'; if(topic==='codes')return'T2'; return'T5'; }
  if(a==='ice maker')return'T6';
  if(a==='oven'){ if(topic==='codes')return'T2'; return'T1'; }
  if(a==='microwave')return'Cmic';
  if(a==='gas grill'||a==='pellet smoker')return'T8';
  return'T1';
}

const ONE = 'EXACTLY ONE person in the whole frame — this single male technician, alone; NO customer, NO second person, NO handshake, NO other people and NO body parts of anyone else anywhere including the far left edge, corners and background. Focused solo working pose, looking at his tool or the appliance, not at the camera, not turned as if talking to anyone.';
const LEFT = 'The LEFT ~40 percent of the frame is clean plain background — a wall or empty counter, negative space with nothing important and no people in it.';
const NOTX = 'no visible brand badge, no model-number plate, no readable brand name or text anywhere.';
const STYLE = ' Ultra-wide 21:9 cinematic hero photograph, photorealistic candid documentary style, natural realistic lighting, NOT AI-glossy. COMPOSITION: main subject in the RIGHT third, sharp focus; LEFT ~40 percent clean plain background. Realistic natural hands, correct limb count for one person. Absolutely NO logos, NO brand names, NO readable text or badges. 2K.';

function subject(tmpl, appl, appear){
  const A = `a brand-neutral ${appl}`;
  switch(tmpl){
    case 'T1': return `A single male appliance repair technician (${appear}) alone in the RIGHT third, kneeling at an open ${A}, holding a multimeter to an internal component, a service light and hand tools on a canvas mat. ${ONE} ${LEFT} ${A}, ${NOTX}`;
    case 'T2': return `Close-up in the RIGHT half of a ${A} control panel, the segmented display glowing with only generic dashes and lit segments, no readable characters; at most one single technician fingertip near a button and no other body parts. ${LEFT} ${A}, ${NOTX}`;
    case 'T3': return `Close-up in the RIGHT half of a single technician's own two gloved hands twisting out the cylindrical mesh drain filter from the bottom of an open ${A}, a shallow pan and towel with water and food debris. Only one person's hands, no other body parts anywhere. ${LEFT} ${A}, ${NOTX}`;
    case 'T4': return `A single male appliance repair technician (${appear}) alone in the RIGHT third, pulling a thick grey lint clog from a disconnected flexible ${A} vent hose, a vent brush on the floor. ${ONE} ${LEFT} ${A}, ${NOTX}`;
    case 'T5': return `A single male appliance repair technician (${appear}) alone in the RIGHT third, shining a flashlight into the open interior of a ${A}, inspecting the rear cooling panel, food shelves visible. ${ONE} ${LEFT} ${A}, ${NOTX}`;
    case 'T6': return `Close-up in the RIGHT half of a removed automatic ice-maker assembly and a half-full ice bin on a service towel beside an open ${A} freezer compartment, frost detail on the mold. No people. ${LEFT} ${A}, ${NOTX}`;
    case 'T7': return `Top-down close-up in the RIGHT half of a tidy service bench with common ${A} replacement parts on a clean shop towel — a pump, a valve, a control board, a thermostat — beside a multimeter and hand tools. No people. ${LEFT} parts have ${NOTX}`;
    case 'T8': return `A single male appliance repair technician (${appear}) alone in the RIGHT third, at an open ${A} on a backyard patio, access panel or firebox open, checking the burner and igniter with a tool. ${ONE} ${LEFT} ${A}, ${NOTX}`;
    case 'Cdry': return `Close-up in the RIGHT half of an open dishwasher door at cycle end: water droplets clinging to plastic containers on the upper rack while glass tumblers on the lower rack are dry, faint steam. No people. ${LEFT} brand-neutral dishwasher, ${NOTX}`;
    case 'Ccln': return `A single male appliance repair technician (${appear}) alone in the RIGHT third, holding up a removed dishwasher spray arm to the light and checking its clogged spray holes, the open dishwasher tub behind. ${ONE} ${LEFT} brand-neutral dishwasher, ${NOTX}`;
    case 'Csqk': return `A single male appliance repair technician (${appear}) alone in the RIGHT third, front panel of a brand-neutral dryer open, one hand slowly rotating the drum to trace a squeak while inspecting the drum support rollers and belt. ${ONE} ${LEFT} brand-neutral dryer, ${NOTX}`;
    case 'Cmic': return `A single male appliance repair technician (${appear}) alone in the RIGHT third, holding a multimeter in his own two hands and looking down at it, its probe against the exterior lower edge of a CLOSED over-the-range microwave; the microwave is fully closed with no interior visible. ${ONE} ${LEFT} brand-neutral microwave, ${NOTX}`;
    case 'R': return `A macro close-up in the RIGHT half of a single upright chrome dishwasher AIR GAP fitting on a stainless kitchen sink deck: a cylindrical polished chrome cap about 2.5 inches tall with an upper section ringed with horizontal vent slots and louvers, standing alone. No people. ${LEFT} no text, no logos.`;
    default: return `A brand-neutral ${appl} in a kitchen. ${LEFT} ${NOTX}`;
  }
}

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}

async function gen(fname, subj){
  const out=path.join(OUTDIR,fname);
  if(validPng(out)){console.log('· cached',fname);return true;}
  const body=JSON.stringify({contents:[{parts:[{text:subj+STYLE}]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'21:9'}}});
  for(let a=1;a<=5;a++){
    let resp;try{resp=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body});}catch(e){console.error('  net',e.message);await sleep(4000);continue;}
    if([429,500,503].includes(resp.status)){const t=await resp.text();const m=t.match(/retry in ([\d.]+)s/i);const w=m?Math.ceil(parseFloat(m[1])*1000)+1500:8000*a;console.error(`  HTTP ${resp.status} wait ${Math.round(w/1000)}s`);await sleep(w);continue;}
    const j=await resp.json();
    if(resp.status!==200){console.error('  HTTP',resp.status,j?.error?.message);await sleep(3000);continue;}
    const img=(j?.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData)?.inlineData;
    if(!img){console.error('  no image fr=',j?.candidates?.[0]?.finishReason);await sleep(3000);continue;}
    fs.writeFileSync(out,Buffer.from(img.data,'base64'));
    if(!validPng(out)){console.error('  bad png');await sleep(2000);continue;}
    console.log('✓',fname,`(${(fs.statSync(out).size/1024).toFixed(0)}KB)`);return true;
  }
  console.error('✗ FAIL',fname);return false;
}

let i=0,done=0,skip=0,fail=[];
for(const full of PAGES){
  const section=full.split('/')[0]; // services|outdoor
  const rest=full.slice(section.length+1); // e.g. dishwasher-repair/lg-error-codes
  const applKey=rest.split('/')[0];
  const slug=rest.split('/').slice(1).join('/');
  const applName=APPL[applKey]||'appliance';
  if(FILTER!=='all' && !rest.includes(FILTER)) continue;
  // skip if hero already placed
  const heroPath=path.join('public/images',section,applKey,slug,'hero.webp');
  if(fs.existsSync(heroPath)){console.log('· placed, skip',rest);skip++;i++;continue;}
  const topic=topicOf(slug); const tmpl=tmplOf(applName,topic,slug);
  const appear=APPEAR[i%3]; i++;
  const subj=subject(tmpl, applName, appear);
  const fname=`${section}__${applKey}__${slug.replace(/\//g,'-')}.png`;
  if(await gen(fname,subj)) done++; else fail.push(rest);
  await sleep(1400);
}
console.log(`\nDONE cluster='${FILTER}': generated=${done} skipped=${skip} failed=${fail.length}${fail.length?' -> '+fail.join(', '):''}`);
