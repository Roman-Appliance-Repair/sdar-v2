import https from 'https';
import fs from 'fs';

const SITE = 'https://samedayappliance.repair';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

console.log('Fetching sitemap-index.xml...');
const indexXml = await fetchUrl(`${SITE}/sitemap-index.xml`);

const childSitemaps = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log(`Found ${childSitemaps.length} child sitemap(s):`);
childSitemaps.forEach(s => console.log(`  ${s}`));

const allUrls = new Set();
for (const sitemapUrl of childSitemaps) {
  console.log(`\nFetching ${sitemapUrl}...`);
  const xml = await fetchUrl(sitemapUrl);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`  Extracted ${urls.length} URLs`);
  urls.forEach(u => {
    if (u.startsWith(SITE)) allUrls.add(u);
  });
}

const urlArray = Array.from(allUrls).sort();

console.log(`\n=== SUMMARY ===`);
console.log(`Total unique URLs: ${urlArray.length}`);
console.log(`\nFirst 5:`);
urlArray.slice(0, 5).forEach(u => console.log(`  ${u}`));
console.log(`\nLast 5:`);
urlArray.slice(-5).forEach(u => console.log(`  ${u}`));

const redirectChecks = urlArray.filter(u =>
  u.endsWith('/book') ||
  u.includes('www.samedayappliance') ||
  !u.startsWith('https://')
);
console.log(`\nPotential problem URLs (should be 0): ${redirectChecks.length}`);
redirectChecks.forEach(u => console.log(`  WARN ${u}`));

const payload = {
  host: 'samedayappliance.repair',
  key: '32c2d9cecb72408cbd6f91136388e33a',
  keyLocation: 'https://samedayappliance.repair/32c2d9cecb72408cbd6f91136388e33a.txt',
  urlList: urlArray
};

fs.writeFileSync('C:/Users/Roman/Downloads/indexnow-payload.json', JSON.stringify(payload, null, 2));

const sizeKb = (fs.statSync('C:/Users/Roman/Downloads/indexnow-payload.json').size / 1024).toFixed(1);
console.log(`\nPayload saved: C:/Users/Roman/Downloads/indexnow-payload.json (${sizeKb} KB)`);

if (urlArray.length > 10000) {
  console.error(`WARNING: ${urlArray.length} URLs exceeds IndexNow 10,000 batch limit. Need chunking.`);
} else {
  console.log(`OK: Fits in single batch (limit 10,000)`);
}
