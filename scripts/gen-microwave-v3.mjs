// scripts/gen-microwave-v3.mjs — microwave hero regen, hardened SINGLE-person, no interaction.
import fs from 'node:fs';
import path from 'node:path';
const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/37029127-59b9-434c-a4f3-05f246308347/scratchpad/pilot';

const SUBJECT = 'EXACTLY ONE person in the entire frame: a single male appliance repair technician, completely alone. NO customer, NO second person, NO handshake, NO other people, and NO body parts of anyone else anywhere in the frame including the far left edge, corners, and background. The technician stands alone in the RIGHT THIRD of the frame, holding a multimeter in both his own hands and looking down at the multimeter screen, its probe resting against the exterior lower edge of a CLOSED over-the-range microwave mounted above a range. The microwave is fully closed with no interior or internal components visible. His pose is a focused solo working stance — he looks only at his own instrument, not at the camera and not turned to the side as if speaking to someone. The LEFT HALF of the frame is a plain empty painted kitchen wall and a bare clean counter — clean negative space with absolutely no people, hands, arms, or objects in it. Generic brand-neutral microwave and range, no badges.';
const STYLE = ' Ultra-wide 21:9 cinematic hero photograph, photorealistic candid documentary style, natural realistic lighting, NOT AI-glossy. COMPOSITION: the single technician subject is in the RIGHT third, sharp focus; the LEFT ~40 percent is clean plain background (wall/empty counter) with nothing in it. Realistic natural hands and correct number of limbs for one person only. Absolutely NO logos, NO brand names, NO readable text or badges, NO model-number plates. 2K.';

const body = JSON.stringify({ contents:[{parts:[{text: SUBJECT + STYLE}]}], generationConfig:{responseModalities:['IMAGE'], imageConfig:{aspectRatio:'21:9'}} });
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}

const out = path.join(OUTDIR,'C-microwave_v3.png');
for(let a=1;a<=5;a++){
  let resp; try{ resp=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body}); }catch(e){console.error('net',e.message);await sleep(4000);continue;}
  if([429,500,503].includes(resp.status)){const t=await resp.text();const m=t.match(/retry in ([\d.]+)s/i);const w=m?Math.ceil(parseFloat(m[1])*1000)+1500:8000*a;console.error(`HTTP ${resp.status} wait ${Math.round(w/1000)}s`);await sleep(w);continue;}
  const j=await resp.json();
  if(resp.status!==200){console.error('HTTP',resp.status,j?.error?.message);await sleep(3000);continue;}
  const img=(j?.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData)?.inlineData;
  if(!img){console.error('no image fr=',j?.candidates?.[0]?.finishReason);await sleep(3000);continue;}
  fs.writeFileSync(out,Buffer.from(img.data,'base64'));
  if(!validPng(out)){console.error('bad png');await sleep(2000);continue;}
  console.log(`OK C-microwave_v3.png (${(fs.statSync(out).size/1024).toFixed(0)}KB)`);process.exit(0);
}
console.error('FAILED');process.exit(1);
