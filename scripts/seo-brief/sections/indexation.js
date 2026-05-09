import { readFile } from 'node:fs/promises';
import { listSitemaps, getSitemap, inspectUrl, searchAnalytics } from '../lib/gsc-client.js';
import { loadAllSitemapUrls, pathOf, pageBusinessPriority } from '../lib/sitemap.js';
import { STATE_FILES, SITE_ORIGIN } from '../lib/paths.js';
import { h2, h3, table, num, pct, callout, isoDateMinusDays } from '../lib/format.js';
import { indexationExpectedToday, daysBetween } from '../lib/project-state.js';
import { indexationHealth } from '../lib/health-score.js';

const URL_INSPECTION_SAMPLE_SIZE = 12;

export async function buildIndexation({ state, mode = 'quick', today = new Date() }) {
  const lines = [];
  lines.push(h2('Indexation Health'));

  // 1) Sitemaps API totals
  const sitemaps = await listSitemaps().catch((e) => { lines.push(callout('warn', [`sitemaps.list failed: ${e.message}`])); return []; });
  const indexSitemap = sitemaps.find((s) => /sitemap-index\.xml$/.test(s.path)) || sitemaps[0];
  let submitted = null;
  let indexed = null;
  let warnings = null;
  let errors = null;
  let sitemapLastDownloaded = null;

  if (indexSitemap) {
    try {
      const detail = await getSitemap(indexSitemap.path);
      const contents = detail.contents?.[0] || {};
      submitted = Number(contents.submitted ?? 0) || null;
      indexed = Number(contents.indexed ?? 0) || null;
      warnings = Number(detail.warnings ?? 0);
      errors = Number(detail.errors ?? 0);
      sitemapLastDownloaded = detail.lastDownloaded || null;
    } catch (e) {
      lines.push(callout('warn', [`sitemaps.get failed: ${e.message}`]));
    }
  }

  // 2) Manual coverage snapshot (from GSC UI export)
  let coverage = null;
  let coverageSnapshotStale = false;
  try {
    const raw = await readFile(STATE_FILES.coverageSnapshot, 'utf8');
    coverage = JSON.parse(raw);
    if (coverage.snapshotDate) {
      const days = daysBetween(coverage.snapshotDate, today.toISOString().slice(0, 10));
      if (days > 14) coverageSnapshotStale = true;
    } else {
      coverageSnapshotStale = true;
    }
  } catch {
    coverageSnapshotStale = true;
  }

  // 3) Sitemap actual content (URLs + lastmod)
  let sitemapUrls = [];
  try {
    sitemapUrls = await loadAllSitemapUrls();
  } catch (e) {
    lines.push(callout('warn', [`sitemap fetch failed: ${e.message}`]));
  }

  // 4) URL Inspection sample — pick high-priority URLs not seen in GSC clicks
  let inspectionSample = [];
  if (mode !== 'quick') {
    inspectionSample = await sampleInspections({ sitemapUrls, today });
  }

  // 5) Stuck discovered list (from inspection sample if deep, else heuristic)
  const stuckDiscovered = inspectionSample.filter(
    (i) => /Discovered/i.test(i.coverageState || '') && i.daysSinceFirstSeen >= 14,
  );

  // 6) Quick summary
  const expectedPct = indexationExpectedToday(state, today);
  // Use the actual sitemap count as denominator if it's larger and Google's view is stale.
  const denominator = (sitemapUrls.length > (submitted || 0)) ? sitemapUrls.length : submitted;
  const indexedPct = denominator && indexed !== null ? indexed / denominator : null;
  const healthScore = indexationHealth({
    indexedPct: indexedPct === null ? null : indexedPct * 100,
    expectedPct,
  });

  // Cross-check: sitemap-index actual content (from fetch) vs Google's view (from API)
  const actualSitemapCount = sitemapUrls.length || null;
  const apiVsActual = (submitted !== null && actualSitemapCount !== null && Math.abs(submitted - actualSitemapCount) > 50);

  lines.push('**Sitemap status (Google\'s view):**');
  lines.push(table(
    ['Submitted (GSC API)', 'Indexed', 'Warnings', 'Errors', 'GSC last downloaded'],
    [[
      num(submitted),
      `${num(indexed)} (${pct(indexedPct, 1)})`,
      num(warnings),
      num(errors),
      sitemapLastDownloaded ? sitemapLastDownloaded.slice(0, 10) : '—',
    ]],
  ));
  if (actualSitemapCount !== null) {
    lines.push(`> Sitemap (live fetch from origin): **${num(actualSitemapCount)} URLs**.`);
  }
  if (apiVsActual) {
    lines.push(callout('warn', [
      `GSC sees ${num(submitted)} submitted URLs but the live sitemap actually has ${num(actualSitemapCount)}.`,
      `Last GSC download: ${sitemapLastDownloaded?.slice(0, 10)}. Google has not re-fetched since deploy — submit a re-crawl from GSC Sitemaps panel.`,
    ]));
  }

  if (expectedPct !== null) {
    const baselineForPct = actualSitemapCount || submitted;
    const realIndexedPct = (indexed !== null && baselineForPct) ? indexed / baselineForPct : null;
    const lag = realIndexedPct === null ? null : Math.round(expectedPct - realIndexedPct * 100);
    lines.push(`> Expected ~${expectedPct}% indexed by today (per project-state timeline). ` +
      (lag === null ? '' : (lag > 5 ? `Currently **${lag}pp behind** (using actual sitemap count as denominator).` : (lag < -5 ? `Currently **${-lag}pp ahead**.` : 'On track.'))));
  }

  // 7) Coverage breakdown (manual snapshot)
  if (coverage && !coverageSnapshotStale && coverage.totals?.indexed !== null) {
    lines.push(h3(`Coverage breakdown (manual snapshot, ${coverage.snapshotDate})`));
    const b = coverage.notIndexedBreakdown || {};
    const rows = Object.entries(b)
      .filter(([, v]) => v !== null && v !== undefined && v > 0)
      .sort((a, b2) => b2[1] - a[1])
      .map(([k, v]) => [k, num(v)]);
    if (rows.length > 0) {
      lines.push(table(['Reason', 'Count'], rows));
    } else {
      lines.push('*(no breakdown values populated yet)*');
    }
    const expectedNoindex = state.expectations?.noindex_redirects_expected ?? null;
    if (expectedNoindex !== null && b.noindex !== null && b.noindex !== undefined) {
      const diff = b.noindex - expectedNoindex;
      lines.push(`> noindex: actual ${num(b.noindex)} vs expected ~${num(expectedNoindex)} (redirect transit pages). Δ ${diff >= 0 ? '+' : ''}${num(diff)}.`);
    }
  } else {
    lines.push(callout('warn', [
      `Coverage snapshot ${coverageSnapshotStale ? 'is stale or missing' : 'not loaded'}.`,
      'To refresh: GSC UI → Pages → copy figures into briefings/coverage-snapshot.json.',
    ]));
  }

  // 8) Priority manual indexing list
  const priorityList = await buildPriorityIndexList({ state, sitemapUrls, today });
  lines.push(h3('Priority manual indexing list (top 10 — copy/paste into GSC URL Inspection)'));
  if (priorityList.length === 0) {
    lines.push('*(no candidates — sitemap data unavailable, or all priority pages already in clicks data)*');
  } else {
    lines.push('```');
    priorityList.slice(0, 10).forEach((p) => lines.push(p.url));
    lines.push('```');
    lines.push(table(
      ['#', 'Priority', 'Path', 'Last modified'],
      priorityList.slice(0, 10).map((p, i) => [
        String(i + 1),
        String(p.priority),
        p.path,
        p.lastmod ? p.lastmod.slice(0, 10) : '—',
      ]),
    ));
  }

  // 9) Manual request tracking
  const tracking = await loadManualRequests();
  if (tracking?.requests?.length > 0) {
    const pending = tracking.requests.filter((r) => !r.indexedAt);
    const completed = tracking.requests.filter((r) => r.indexedAt);
    lines.push(h3('Manual request tracking'));
    lines.push(`Total requests logged: ${tracking.requests.length} · pending: ${pending.length} · indexed after request: ${completed.length}`);
    if (completed.length > 0) {
      const avgDays = completed
        .map((r) => daysBetween(r.requestedAt.slice(0, 10), r.indexedAt.slice(0, 10)))
        .reduce((a, b) => a + b, 0) / completed.length;
      lines.push(`Average request → indexed: ${avgDays.toFixed(1)} days.`);
    }
  }

  // 10) Stuck pages
  if (stuckDiscovered.length > 0) {
    lines.push(h3('Stuck pages (>14d in "Discovered, not indexed")'));
    lines.push(table(
      ['URL', 'Coverage state', 'Days since first crawl'],
      stuckDiscovered.slice(0, 10).map((s) => [s.url, s.coverageState, String(s.daysSinceFirstSeen)]),
    ));
  }

  // 11) Deep mode adds inspection sample
  if (mode !== 'quick' && inspectionSample.length > 0) {
    lines.push(h3('URL Inspection sample (random high-priority pages)'));
    lines.push(table(
      ['URL', 'Indexing state', 'Coverage', 'Last crawl'],
      inspectionSample.slice(0, 10).map((s) => [
        s.url,
        s.verdict || '—',
        s.coverageState || '—',
        s.lastCrawlTime || '—',
      ]),
    ));
  }

  return {
    submitted,
    indexed,
    indexedPct,
    expectedPct,
    netChange24h: null, // populated by baseline diff in main brief
    healthScore,
    coverageSnapshotStale,
    stuckDiscovered: stuckDiscovered.map((s) => s.url),
    newlyIndexedSample: [],
    priorityList: priorityList.slice(0, 10).map((p) => p.url),
    inspectionSample,
    markdown: lines.join('\n'),
  };
}

async function sampleInspections({ sitemapUrls, today }) {
  // Pick a stratified sample by business priority — 6 high-priority + 6 random.
  if (sitemapUrls.length === 0) return [];
  const enriched = sitemapUrls.map((u) => ({
    ...u,
    path: pathOf(u.loc),
    priority: pageBusinessPriority(pathOf(u.loc)),
  }));
  const high = enriched.filter((e) => e.priority >= 60).sort(() => Math.random() - 0.5).slice(0, 6);
  const rest = enriched.filter((e) => e.priority < 60).sort(() => Math.random() - 0.5).slice(0, 6);
  const sample = [...high, ...rest];

  const out = [];
  for (const item of sample) {
    try {
      const data = await inspectUrl(item.loc);
      const ix = data.inspectionResult?.indexStatusResult || {};
      const verdict = ix.verdict || data.inspectionResult?.indexStatusResult?.verdict;
      const coverageState = ix.coverageState;
      const lastCrawlTime = ix.lastCrawlTime;
      let daysSinceFirstSeen = null;
      if (ix.lastCrawlTime) {
        daysSinceFirstSeen = daysBetween(ix.lastCrawlTime.slice(0, 10), today.toISOString().slice(0, 10));
      }
      out.push({ url: item.loc, verdict, coverageState, lastCrawlTime, daysSinceFirstSeen, priority: item.priority });
    } catch (e) {
      out.push({ url: item.loc, error: e.message, priority: item.priority });
    }
  }
  return out;
}

async function buildPriorityIndexList({ state, sitemapUrls, today }) {
  if (sitemapUrls.length === 0) return [];
  const todayIso = today.toISOString().slice(0, 10);

  // Pages that have already received any GSC impression in the last 30 days are
  // (almost certainly) indexed — exclude them from the manual request list.
  let pagesWithImpressions = new Set();
  try {
    const startDate = isoDateMinusDays(30, today);
    const endDate = isoDateMinusDays(3, today); // SC lag
    const resp = await searchAnalytics({ startDate, endDate, dimensions: ['page'], rowLimit: 25_000 });
    pagesWithImpressions = new Set((resp.rows || []).map((r) => pathOf(r.keys[0])));
  } catch {
    // continue with empty set
  }

  return sitemapUrls
    .map((u) => ({
      url: u.loc,
      path: pathOf(u.loc),
      lastmod: u.lastmod,
      priority: pageBusinessPriority(pathOf(u.loc)),
      ageDays: u.lastmod ? daysBetween(u.lastmod.slice(0, 10), todayIso) : null,
    }))
    .filter((p) => !pagesWithImpressions.has(p.path))
    .filter((p) => p.priority >= 60)
    .filter((p) => p.ageDays === null || p.ageDays >= 3)
    .sort((a, b) => b.priority - a.priority || ((b.ageDays ?? 0) - (a.ageDays ?? 0)));
}

async function loadManualRequests() {
  try {
    const raw = await readFile(STATE_FILES.manualRequests, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
