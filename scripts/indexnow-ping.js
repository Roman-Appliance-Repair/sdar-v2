#!/usr/bin/env node
// IndexNow batch pinger for sdar-v2.
//
// Reads sitemap-index.xml, filters URLs whose lastmod is within the configured window
// (default 7 days), and submits them in a single batch to the IndexNow API.
// Logs every batch in <wiki>/briefings/indexnow-log.json.
//
// Usage:
//   node scripts/indexnow-ping.js                   # 7-day window (default)
//   node scripts/indexnow-ping.js --days 14         # custom window
//   node scripts/indexnow-ping.js --all             # every URL in sitemap (cap 10000)
//   node scripts/indexnow-ping.js --dry-run         # show URLs but don't send
//
// Note:
//   - Google ignores IndexNow officially. Bing/Yandex/Naver/Seznam consume it; ChatGPT
//     uses Bing's index, so IndexNow helps there indirectly.
//   - IndexNow accepts up to 10,000 URLs per call.

import { readFile, writeFile } from 'node:fs/promises';
import { loadAllSitemapUrls, isWithinDays, isSamedayUrl } from './seo-brief/lib/sitemap.js';
import { STATE_FILES, INDEXNOW_KEY, SITE_DOMAIN, SITEMAP_INDEX_URL } from './seo-brief/lib/paths.js';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_LOCATION = `https://${SITE_DOMAIN}/${INDEXNOW_KEY}.txt`;
const MAX_URLS_PER_BATCH = 10_000;

function parseArgs(argv) {
  const args = { days: 7, all: false, dryRun: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--days') { args.days = Number(argv[i + 1]); i += 1; }
    else if (a === '--all') { args.all = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '-h' || a === '--help') { args.help = true; }
  }
  return args;
}

async function readLog() {
  try { return JSON.parse(await readFile(STATE_FILES.indexnowLog, 'utf8')); }
  catch { return { schemaVersion: 1, batches: [] }; }
}
async function writeLog(log) {
  await writeFile(STATE_FILES.indexnowLog, JSON.stringify(log, null, 2), 'utf8');
}

async function postBatch(urls) {
  const body = {
    host: SITE_DOMAIN,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  return { status: res.status, statusText: res.statusText };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node scripts/indexnow-ping.js [--days N] [--all] [--dry-run]

  --days N      Filter URLs whose <lastmod> is within N days (default 7)
  --all         Send every URL from sitemap (cap ${MAX_URLS_PER_BATCH})
  --dry-run     Print URLs but don't POST

Sitemap: ${SITEMAP_INDEX_URL}`);
    return;
  }

  console.log(`[indexnow-ping] Loading sitemap…`);
  const urls = await loadAllSitemapUrls();
  console.log(`[indexnow-ping] Sitemap URLs: ${urls.length}`);

  const filtered = urls.filter((u) => isSamedayUrl(u.loc));
  let target;
  if (args.all) {
    target = filtered.slice(0, MAX_URLS_PER_BATCH).map((u) => u.loc);
    console.log(`[indexnow-ping] --all: sending ${target.length} URLs (capped at ${MAX_URLS_PER_BATCH}).`);
  } else {
    target = filtered.filter((u) => isWithinDays(u.lastmod, args.days)).map((u) => u.loc);
    console.log(`[indexnow-ping] Within last ${args.days} days: ${target.length} URLs.`);
  }

  if (target.length === 0) {
    console.log('[indexnow-ping] Nothing to send.');
    return;
  }

  if (args.dryRun) {
    console.log('--- URLs (dry run) ---');
    target.forEach((u) => console.log(u));
    console.log(`--- Total: ${target.length} ---`);
    return;
  }

  const result = await postBatch(target);
  console.log(`[indexnow-ping] HTTP ${result.status} ${result.statusText}`);

  const log = await readLog();
  log.batches.push({
    sentAt: new Date().toISOString(),
    windowDays: args.all ? null : args.days,
    urlCount: target.length,
    status: result.status,
    statusText: result.statusText,
    accepted: result.status === 200 || result.status === 202,
    sample: target.slice(0, 5),
  });
  // keep last 200 batches
  if (log.batches.length > 200) log.batches = log.batches.slice(-200);
  await writeLog(log);
  console.log(`[indexnow-ping] Logged batch to indexnow-log.json.`);
}

main().catch((err) => {
  console.error('[indexnow-ping] fatal:', err);
  process.exit(1);
});
