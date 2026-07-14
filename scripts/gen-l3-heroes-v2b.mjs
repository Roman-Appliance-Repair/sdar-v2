// scripts/gen-l3-heroes-v2b.mjs — regenerate the 2 Roman-flagged existing brand heroes
// (gaggenau, aga-stove-repair) with brand-signature-accurate design prompts, replacing the
// prior generic-technician heroes. Same rules: no readable brands/text, no-people showcase,
// 21:9, 6-file adaptive set, metadata stripped.
import fs from 'node:fs'; import path from 'node:path'; import sharp from 'sharp';
const KEY = fs.readFileSync('secrets/gemini-key.txt','utf8').trim();
const URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const RAW='C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/31bd7613-2ca8-4be8-8011-0ca77ceb5972/scratchpad/l3-heroes-v2';
fs.mkdirSync(RAW,{recursive:true});
const NOTX='CRITICAL: absolutely NO readable brand name, NO logo, NO model-number plate, NO badge and NO text of any kind anywhere — design language and materials only, never a nameplate.';
const RIGHT='The appliance is the hero in the RIGHT two-thirds, sharp focus, beautifully lit. LEFT ~40 percent is clean plain background, negative space, no people.';
const STYLE=' Ultra-wide 21:9 cinematic architectural-photography hero shot, photorealistic, warm natural lighting, interiors-magazine look, NOT AI-glossy, no people. 2K.';
const P={
  'gaggenau': `A minimalist German luxury built-in cooking suite in a sleek modern kitchen: a dark anthracite-and-stainless professional cooktop with individual modular Vario-style burner/teppanyaki modules set flush into a stone countertop, and above it a wall-mounted combi-steam oven with a flush dark-glass door and a single precision stainless handle. Very clean, architectural, industrial-luxury, handleless cabinetry. ${RIGHT} ${NOTX}`,
  'aga-stove-repair': `A classic British cast-iron heat-storage range cooker as the centerpiece of a cozy English country kitchen: a heavy boxy enameled body in British-racing-green (or cream) with TWO large round chrome-domed hinged insulated hotplate lids on the top surface, a chunky chrome towel rail across the front, solid cast-iron construction, radiant-heat design. Flagstone floor, timber beams, kettle on top. ${RIGHT} ${NOTX}`,
};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
function validPng(p){try{const fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);fs.closeSync(fd);return b.toString('hex').startsWith('89504e470d0a1a0a')&&fs.statSync(p).size>10000;}catch{return false;}}
async function gen(rawPath,prompt){
  const body=JSON.stringify({contents:[{parts:[{text:prompt+STYLE}]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'21:9'}}});
  let c=0;
  for(let a=1;a<=14&&c<3;a++){
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
    const h=Math.round(w*9/21); const q=w===1920?70:(w===960?70:68);
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).webp({quality:q}).toFile(path.join(dir,`${name}.webp`));
    await sharp(rawPath).rotate().resize(w,h,{fit:'cover',position:'centre'}).jpeg({quality:82,mozjpeg:true}).toFile(path.join(dir,`${name}.jpg`));
  }
  return (fs.statSync(path.join(dir,'hero.webp')).size/1024).toFixed(0);
}
const done=[],failed=[];
for(const slug of Object.keys(P)){
  process.stdout.write(`gen ${slug} ... `); const raw=path.join(RAW,`${slug}.png`);
  const ok=await gen(raw,P[slug]); console.log(ok?'ok':'FAIL');
  if(!ok){failed.push(slug);continue;}
  console.log(`✓ placed ${slug} (hero.webp ${await place(raw,slug)}KB)`); done.push(slug); await sleep(1200);
}
console.log(`\nDONE v2b: placed=${done.length} failed=${failed.length}`); if(failed.length)console.log('FAILED:',failed.join(', '));
