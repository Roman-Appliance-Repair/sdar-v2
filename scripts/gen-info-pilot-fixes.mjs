// scripts/gen-info-pilot-fixes.mjs
// Pilot fixes: composition-corrected regens (subject RIGHT half, left 40% clean) +
// 2 new Issue-1 verification pages + air-gap precise-geometry attempt 2.
import fs from 'node:fs';
import path from 'node:path';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/37029127-59b9-434c-a4f3-05f246308347/scratchpad/pilot';
fs.mkdirSync(OUTDIR, { recursive: true });

// COMPOSITION RULE baked in: subject RIGHT half, left ~40% clean negative space for text card.
const STYLE = ' Ultra-wide 21:9 cinematic hero photograph, photorealistic candid documentary style, natural realistic lighting, NOT AI-glossy, no HDR. COMPOSITION: the MAIN SUBJECT is placed in the RIGHT HALF of the frame (ideally the right third), fully in sharp focus. The LEFT ~40 percent of the frame is deliberately CLEAN and simple — a plain wall, empty counter, or soft negative space with nothing important in it — so a text card can overlay the left without covering the subject. Realistic natural hands and proportions. Absolutely NO logos, NO brand names, NO readable text or badges anywhere, NO model-number plates. 2K.';

// [key, slug-or-null(new), subject]
const ITEMS = [
  ['C-microwave_v2','microwave-repair/lg-not-heating',
   'A single male appliance repair technician in a plain navy work shirt, standing on the RIGHT side of the frame in profile, taking a reading with a multimeter held to the exterior lower edge of a CLOSED over-the-range microwave mounted above a range; the microwave stays fully closed with no interior or internal components visible at all. The LEFT part of the frame is a plain painted kitchen wall and an empty counter, negative space. Generic brand-neutral microwave, no badges.'],
  ['T4_v2','dryer-repair/lg-not-heating',
   'A single male appliance repair technician on the RIGHT side of the frame, kneeling and pulling a thick grey lint clog out of a disconnected flexible dryer vent hose behind a front-load dryer, a vent-cleaning brush on the floor. The LEFT part of the frame is a plain empty laundry-room wall, uncluttered negative space, no shelving. Generic brand-neutral dryer, no badges.'],
  ['T5_lg-not-cooling','refrigerator-repair/lg-not-cooling',
   'A single male appliance repair technician on the RIGHT side of the frame, shining a flashlight into the open interior of a stainless refrigerator, inspecting the rear interior cooling panel, food shelves visible. The LEFT part of the frame is a plain kitchen wall and empty counter, negative space. Generic brand-neutral refrigerator, no badges, no readable text.'],
  ['T2_samsung-error-codes','refrigerator-repair/samsung-error-codes',
   "Close-up on the RIGHT side of the frame of a stainless refrigerator's external door control panel, the small display glowing with only generic segments and dashes and no readable characters, a fingertip near a button. The LEFT part of the frame is a plain wall, soft empty negative space. Generic brand-neutral refrigerator, no logo, no readable text."],
  ['R-airgap_v2','dishwasher-repair/air-gap',
   'A macro close-up on the RIGHT side of the frame of a single upright chrome dishwasher AIR GAP fitting standing on a stainless steel kitchen sink deck behind the faucet base: one cylindrical polished chrome cap about 2.5 inches tall, its upper section ringed with horizontal vent slots and louvers, a smooth rounded chrome top, standing alone on the deck. The LEFT part of the frame is soft out-of-focus negative space. No people. No text, no logos.'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}

async function genOne(key, subject){
  const out = path.join(OUTDIR, `${key.replace(/\//g,'-')}.png`);
  const body = JSON.stringify({ contents:[{parts:[{text: subject + STYLE}]}], generationConfig:{responseModalities:['IMAGE'], imageConfig:{aspectRatio:'21:9'}} });
  for (let a=1;a<=5;a++){
    let resp; try{ resp=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body}); } catch(e){ console.error(`  ${key} net ${e.message}`); await sleep(4000); continue; }
    if([429,500,503].includes(resp.status)){const t=await resp.text();const m=t.match(/retry in ([\d.]+)s/i);const w=m?Math.ceil(parseFloat(m[1])*1000)+1500:8000*a;console.error(`  ${key} HTTP ${resp.status} wait ${Math.round(w/1000)}s`);await sleep(w);continue;}
    const j=await resp.json();
    if(resp.status!==200){console.error(`  ${key} HTTP ${resp.status}: ${j?.error?.message}`);await sleep(3000);continue;}
    const img=(j?.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData)?.inlineData;
    if(!img){console.error(`  ${key} no image (fr=${j?.candidates?.[0]?.finishReason})`);await sleep(3000);continue;}
    fs.writeFileSync(out,Buffer.from(img.data,'base64'));
    if(!validPng(out)){console.error(`  ${key} bad PNG`);await sleep(2000);continue;}
    console.log(`OK ${key} -> ${path.basename(out)} (${(fs.statSync(out).size/1024).toFixed(0)}KB)`);return true;
  }
  console.error(`FAIL ${key}`);return false;
}

const failed=[];
for(const [key,,subj] of ITEMS){ if(!(await genOne(key,subj))) failed.push(key); await sleep(1500); }
console.log('DONE. failed:', failed.length? failed.join(', ') : 'none');
