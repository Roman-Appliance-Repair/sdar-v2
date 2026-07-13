// scripts/gen-info-pilot.mjs
// Phase B PILOT — 6 info-page hero images, one per major scene template.
// 21:9 cinematic (matches existing service hero slot 1920x840, subject right 2/3,
// left third soft for text card). NO logos/brand text/model plates. Gemini 2.5 flash image.
// Output PNGs -> scratchpad/pilot/{tmpl}_{section}_{slug}.png  (convert+place is a separate step)
import fs from 'node:fs';
import path from 'node:path';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/37029127-59b9-434c-a4f3-05f246308347/scratchpad/pilot';
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = ' Ultra-wide 21:9 cinematic hero photograph, photorealistic candid documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The main subject sits in the RIGHT two-thirds of the frame in crisp sharp focus; the LEFT third is a soft, out-of-focus blurred background so a dark text panel can be laid over it. Realistic natural hands and proportions. Absolutely NO logos, NO brand names, NO readable text or badges anywhere, NO model-number plates. 2K.';

// [templateId, section, slug, subject]
const ITEMS = [
  ['T1','services','washer-repair/ge-not-spinning',
   'A male appliance repair technician in a plain dark navy polo kneeling beside an open top-load washing machine in a tiled home laundry room, holding a multimeter probe to an internal component near the drum, a small service light and hand tools on a canvas mat on the floor. Generic brand-neutral washing machine, no badges.'],
  ['T2','services','dishwasher-repair/lg-error-codes',
   "Close-up of a stainless dishwasher's top-edge control panel in a modern kitchen, the small segmented digital display glowing with only generic dashes and lit segments, no readable characters. A technician's hand entering the frame reaching toward a button. Generic brand-neutral dishwasher."],
  ['T3','services','dishwasher-repair/bosch-not-draining',
   'Close-up of gloved hands twisting out the cylindrical mesh drain filter from the bottom of an open dishwasher tub, a shallow pan and towel underneath with a little water and food debris, in a home kitchen. Generic brand-neutral dishwasher, no badges.'],
  ['T4','services','dryer-repair/lg-not-heating',
   'A male appliance repair technician pulling a thick grey lint clog out of a disconnected flexible dryer vent hose behind a front-load dryer in a garage laundry area, lint visible in his gloved hand, a vent-cleaning brush on the floor. Generic brand-neutral dryer, no badges.'],
  ['R-airgap','services','dishwasher-repair/air-gap',
   'Macro close-up of a polished chrome dishwasher air-gap fitting mounted at the edge of a stainless steel kitchen sink, the small cylindrical chrome cap and cover cap, two flexible water lines visible just beneath the countertop, a clean modern sink. No people. No text, no logos.'],
  ['C-microwave','services','microwave-repair/lg-not-heating',
   'A male appliance repair technician standing beside a CLOSED over-the-range microwave mounted above a stove in a kitchen, touching a multimeter probe to the wall area at the exterior; the microwave door and cabinet are fully CLOSED with no interior or internal components visible at all. Generic brand-neutral microwave, no badges.'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}

async function genOne(tmpl, section, slug, subject){
  const fname = `${tmpl}_${section}_${slug.replace(/\//g,'-')}.png`;
  const out = path.join(OUTDIR, fname);
  const body = JSON.stringify({
    contents:[{parts:[{text: subject + STYLE}]}],
    generationConfig:{responseModalities:['IMAGE'], imageConfig:{aspectRatio:'21:9'}},
  });
  for (let a=1;a<=5;a++){
    let resp;
    try{ resp=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body}); }
    catch(e){ console.error(`  ${tmpl} net err ${e.message}`); await sleep(4000); continue; }
    if([429,500,503].includes(resp.status)){const t=await resp.text();const m=t.match(/retry in ([\d.]+)s/i);const w=m?Math.ceil(parseFloat(m[1])*1000)+1500:8000*a;console.error(`  ${tmpl} HTTP ${resp.status} wait ${Math.round(w/1000)}s`);await sleep(w);continue;}
    const j=await resp.json();
    if(resp.status!==200){console.error(`  ${tmpl} HTTP ${resp.status}: ${j?.error?.message}`);await sleep(3000);continue;}
    const img=(j?.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData)?.inlineData;
    if(!img){console.error(`  ${tmpl} no image (fr=${j?.candidates?.[0]?.finishReason})`);await sleep(3000);continue;}
    fs.writeFileSync(out,Buffer.from(img.data,'base64'));
    if(!validPng(out)){console.error(`  ${tmpl} bad PNG retry`);await sleep(2000);continue;}
    console.log(`OK ${tmpl} ${slug} -> ${fname} (${(fs.statSync(out).size/1024).toFixed(0)}KB)`);return true;
  }
  console.error(`FAIL ${tmpl} ${slug}`);return false;
}

const failed=[];
for(const [t,sec,slug,subj] of ITEMS){ if(!(await genOne(t,sec,slug,subj))) failed.push(t); await sleep(1500); }
console.log('DONE. failed:', failed.length? failed.join(', ') : 'none');
console.log('OUTDIR:', OUTDIR);
