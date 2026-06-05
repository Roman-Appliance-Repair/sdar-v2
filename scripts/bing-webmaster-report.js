/**
 * Bing Webmaster API report — reusable weekly snapshot.
 *
 * Usage:  node scripts/bing-webmaster-report.js
 *
 * Reads the API key from secrets/bing-webmaster.key (gitignored — the key
 * must never be committed). Pulls three endpoints and prints a compact
 * markdown report to the console, plus saves a copy to the wiki repo:
 *   C:\Users\Roman\projects\sdar-v2-wiki\sdar-v2-wiki\briefings\bing-YYYY-MM-DD.md
 *
 * Endpoints (JSON flavor of api.svc):
 *   1. GetRankAndTrafficStats — daily impressions/clicks → weekly rollup + WoW
 *   2. GetQueryStats          — top-30 queries by impressions
 *   3. GetCrawlStats          — crawl health (pages crawled, errors, in-index)
 *
 * Any endpoint failure is noted in the report instead of crashing the run.
 * No external dependencies — Node 18+ global fetch.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://samedayappliance.repair';
const API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
const KEY_FILE = path.join(__dirname, '..', 'secrets', 'bing-webmaster.key');
const WIKI_BRIEFINGS_DIR =
  'C:\\Users\\Roman\\projects\\sdar-v2-wiki\\sdar-v2-wiki\\briefings';

function readKey() {
  return fs.readFileSync(KEY_FILE, 'utf8').trim();
}

/** Bing returns dates as "/Date(1738742400000-0800)/" — extract the ms epoch. */
function parseBingDate(s) {
  const m = /\/Date\((\d+)/.exec(s);
  return m ? new Date(Number(m[1])) : null;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing d. */
function weekStart(d) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

async function callApi(method, key) {
  const url = `${API_BASE}/${method}?apikey=${key}&siteUrl=${encodeURIComponent(SITE_URL)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`);
  const json = await res.json();
  if (!json || !('d' in json)) throw new Error(`${method}: unexpected response shape`);
  return json.d;
}

function buildTrafficSection(rows) {
  // rows: [{Date, Impressions, Clicks}] daily → weekly rollup, last 8 weeks
  const weeks = new Map();
  for (const r of rows) {
    const d = parseBingDate(r.Date);
    if (!d) continue;
    const wk = fmtDate(weekStart(d));
    const agg = weeks.get(wk) || { impressions: 0, clicks: 0 };
    agg.impressions += r.Impressions || 0;
    agg.clicks += r.Clicks || 0;
    weeks.set(wk, agg);
  }

  const sorted = [...weeks.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const last8 = sorted.slice(-8);

  const lines = [
    '## Traffic — weekly (last 8 weeks)',
    '',
    '| Week of | Impressions | Clicks | Imp WoW |',
    '|---|---|---|---|',
  ];
  let prev = null;
  for (const [wk, { impressions, clicks }] of last8) {
    let wow = '—';
    if (prev !== null && prev > 0) {
      const pct = ((impressions - prev) / prev) * 100;
      wow = `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
    }
    lines.push(`| ${wk} | ${impressions} | ${clicks} | ${wow} |`);
    prev = impressions;
  }

  const total = sorted.reduce(
    (a, [, v]) => ({ i: a.i + v.impressions, c: a.c + v.clicks }),
    { i: 0, c: 0 }
  );
  lines.push('', `Full period: ${total.i} impressions / ${total.c} clicks.`);
  return lines.join('\n');
}

function buildQuerySection(rows) {
  // rows: [{Query, Impressions, Clicks, AvgImpressionPosition, …}]
  // Bing returns one row per query per period — aggregate by query text
  // (sum impressions/clicks, impression-weighted average position).
  const byQuery = new Map();
  for (const r of rows) {
    const q = byQuery.get(r.Query) || { Query: r.Query, Impressions: 0, Clicks: 0, posWeight: 0 };
    const imp = r.Impressions || 0;
    q.Impressions += imp;
    q.Clicks += r.Clicks || 0;
    if (r.AvgImpressionPosition != null) q.posWeight += r.AvgImpressionPosition * imp;
    byQuery.set(r.Query, q);
  }
  for (const q of byQuery.values()) {
    q.AvgImpressionPosition = q.Impressions > 0 ? q.posWeight / q.Impressions : null;
  }

  const top = [...byQuery.values()]
    .sort((a, b) => (b.Impressions || 0) - (a.Impressions || 0))
    .slice(0, 30);

  const lines = [
    '## Top-30 queries (by impressions)',
    '',
    '| # | Query | Impressions | Clicks | Avg pos |',
    '|---|---|---|---|---|',
  ];
  top.forEach((q, i) => {
    const pos =
      q.AvgImpressionPosition != null ? Number(q.AvgImpressionPosition).toFixed(1) : '—';
    lines.push(`| ${i + 1} | ${q.Query} | ${q.Impressions} | ${q.Clicks} | ${pos} |`);
  });
  if (top.length === 0) lines.push('| — | no query data | | | |');
  return lines.join('\n');
}

function buildCrawlSection(rows) {
  // rows: daily crawl stats; show the latest day + 28-day error totals
  const parsed = rows
    .map((r) => ({ ...r, _d: parseBingDate(r.Date) }))
    .filter((r) => r._d)
    .sort((a, b) => a._d - b._d);

  const last = parsed[parsed.length - 1];
  const last28 = parsed.slice(-28);
  const sum = (k) => last28.reduce((a, r) => a + (r[k] || 0), 0);

  const lines = ['## Crawl health'];
  if (!last) return lines.concat(['', 'No crawl data returned.']).join('\n');

  lines.push(
    '',
    `Latest day (${fmtDate(last._d)}):`,
    `- Pages in index: ${last.InIndexPages ?? '—'}`,
    `- Pages crawled: ${last.CrawledPages ?? '—'}`,
    `- Inbound links known to Bing: ${last.InLinks ?? '—'}`,
    '',
    'Errors over last 28 days:',
    `- 4xx: ${sum('Code4xx')} · 5xx: ${sum('Code5xx')} · DNS failures: ${sum('DnsFailures')} · timeouts: ${sum('ConnectionTimeouts')}`,
    `- Blocked by robots.txt: ${sum('BlockedByRobotsTxt')} · 301: ${sum('Code301')} · 302: ${sum('Code302')}`
  );
  return lines.join('\n');
}

async function main() {
  const key = readKey();
  const today = fmtDate(new Date());
  const sections = [
    `# Bing Webmaster — ${SITE_URL} — ${today}`,
    '',
    `Source: Bing Webmaster API (api.svc/json). Site: \`${SITE_URL}\`.`,
  ];

  const jobs = [
    ['GetRankAndTrafficStats', buildTrafficSection],
    ['GetQueryStats', buildQuerySection],
    ['GetCrawlStats', buildCrawlSection],
  ];

  for (const [method, build] of jobs) {
    try {
      const data = await callApi(method, key);
      sections.push('', build(Array.isArray(data) ? data : []));
    } catch (err) {
      sections.push('', `## ${method}`, '', `⚠️ Endpoint failed: ${err.message}`);
    }
  }

  const report = sections.join('\n') + '\n';
  console.log(report);

  try {
    fs.mkdirSync(WIKI_BRIEFINGS_DIR, { recursive: true });
    const outFile = path.join(WIKI_BRIEFINGS_DIR, `bing-${today}.md`);
    fs.writeFileSync(outFile, report, 'utf8');
    console.log(`Saved: ${outFile}`);
  } catch (err) {
    console.error(`Could not save wiki copy: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
