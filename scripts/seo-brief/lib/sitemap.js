// Minimal sitemap parser — pulls <loc>+<lastmod> from a sitemap-index by following
// child sitemaps. Avoids xml libs; sitemaps from Astro are well-formed and the regex
// is fine for our scale.

import { SITEMAP_INDEX_URL } from './paths.js';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'sdar-v2-brief/1.0' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

function extractLocs(xml) {
  const locs = [];
  const re = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const loc = (block.match(/<loc>(.*?)<\/loc>/) || [])[1];
    const lastmod = (block.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1];
    if (loc) locs.push({ loc, lastmod: lastmod || null });
  }
  return locs;
}

function extractIndex(xml) {
  const out = [];
  const re = /<sitemap>([\s\S]*?)<\/sitemap>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const loc = (m[1].match(/<loc>(.*?)<\/loc>/) || [])[1];
    if (loc) out.push(loc);
  }
  return out;
}

export async function loadAllSitemapUrls(indexUrl = SITEMAP_INDEX_URL) {
  const indexXml = await fetchText(indexUrl);
  const childSitemaps = extractIndex(indexXml);
  if (childSitemaps.length === 0) {
    return extractLocs(indexXml);
  }
  const all = [];
  for (const child of childSitemaps) {
    try {
      const xml = await fetchText(child);
      all.push(...extractLocs(xml));
    } catch (err) {
      // continue on per-sitemap failure
      // eslint-disable-next-line no-console
      console.warn(`sitemap fetch failed: ${child} — ${err.message}`);
    }
  }
  return all;
}

export function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function isSamedayUrl(url) {
  return /^https:\/\/(www\.)?samedayappliance\.repair\//.test(url);
}

export function isWithinDays(lastmod, days, now = new Date()) {
  if (!lastmod) return false;
  const t = new Date(lastmod).getTime();
  if (!Number.isFinite(t)) return false;
  return now.getTime() - t <= days * 86_400_000;
}

export function pageBusinessPriority(pathname) {
  // Higher = more important. City pillars + brand pillars + top services.
  const p = pathname.replace(/\/$/, '');
  if (p === '' || p === '/') return 100;
  if (/^\/(west-hollywood|los-angeles|beverly-hills|pasadena|thousand-oaks|glendale|burbank|santa-monica|long-beach|irvine|temecula|rancho-cucamonga)$/.test(p)) return 95;
  if (/^\/[a-z\-]+$/.test(p) && !p.includes('/')) return 80; // other city pillars
  if (/^\/(la|orange|ventura|san-bernardino|riverside)-county$/.test(p)) return 90;
  if (/^\/services\/[a-z\-]+-repair$/.test(p)) return 75;
  if (/^\/brands\/[a-z\-]+$/.test(p)) return 70;
  if (/^\/commercial\/[a-z\-]+(-repair)?$/.test(p)) return 60;
  if (/^\/outdoor\/[a-z\-]+(-repair)?$/.test(p)) return 50;
  if (/^\/price-list\//.test(p)) return 40;
  if (/^\/[a-z\-]+\/[a-z\-]+-repair$/.test(p)) return 35; // city × service
  if (/^\/credentials\//.test(p)) return 30;
  return 20;
}
