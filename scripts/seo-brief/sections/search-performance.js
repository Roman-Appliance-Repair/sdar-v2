import { searchAnalytics } from '../lib/gsc-client.js';
import { isoDateMinusDays, h2, h3, table, num, pct, callout } from '../lib/format.js';
import { suppressionContext, denylistedPagePath, denylistedQueryPattern } from '../lib/project-state.js';
import { searchHealth } from '../lib/health-score.js';
import { compareWindows } from '../lib/baseline.js';
import { pathOf } from '../lib/sitemap.js';

// SC lag: yesterday-2 is the latest reliable day.
const SC_LAG_DAYS = 2;

export async function buildSearchPerformance({ state, baseline, mode = 'quick', today = new Date() }) {
  const lines = [];
  lines.push(h2('Search Performance (GSC)'));

  const yesterday = isoDateMinusDays(SC_LAG_DAYS, today);
  const dayBeforeYesterday = isoDateMinusDays(SC_LAG_DAYS + 1, today);
  const last7End = yesterday;
  const last7Start = isoDateMinusDays(SC_LAG_DAYS + 6, today);

  lines.push(`*GSC data through **${yesterday}** (2-day reporting lag).*`);

  // 1) Yesterday totals
  let yTotals = null;
  let yMinus1Totals = null;
  try {
    const yResp = await searchAnalytics({ startDate: yesterday, endDate: yesterday, dimensions: [], rowLimit: 1 });
    yTotals = yResp.rows?.[0] || null;
    const y1Resp = await searchAnalytics({ startDate: dayBeforeYesterday, endDate: dayBeforeYesterday, dimensions: [], rowLimit: 1 });
    yMinus1Totals = y1Resp.rows?.[0] || null;
  } catch (e) {
    lines.push(callout('warn', [`searchAnalytics totals failed: ${e.message}`]));
    return {
      markdown: lines.join('\n'),
      healthScore: null,
      yesterdayClicks: null,
      yesterdayImpressions: null,
      yesterdayPosition: null,
      suspiciousZeroCtrCount: 0,
      dropperCount: 0,
      topMover: null,
    };
  }

  const last7End_ = last7End;
  let last7Avg = null;
  try {
    const w7 = await searchAnalytics({ startDate: last7Start, endDate: last7End_, dimensions: [], rowLimit: 1 });
    const r = w7.rows?.[0];
    if (r) {
      last7Avg = {
        clicks: r.clicks / 7,
        impressions: r.impressions / 7,
        ctr: r.ctr,
        position: r.position,
      };
    }
  } catch (e) {
    // continue
  }

  const baselineCompare = baseline?.snapshots?.length > 0
    ? {
      clicks: compareWindows(baseline, 'clicks', yesterday),
      impressions: compareWindows(baseline, 'impressions', yesterday),
      ctr: compareWindows(baseline, 'ctr', yesterday),
      position: compareWindows(baseline, 'position', yesterday),
    }
    : null;

  lines.push(h3('Yesterday'));
  lines.push(table(
    ['Metric', 'Yesterday', 'Day before', '7d avg', '28d avg'],
    [
      ['Clicks', num(yTotals?.clicks), num(yMinus1Totals?.clicks),
        last7Avg ? last7Avg.clicks.toFixed(1) : '—',
        baselineCompare?.clicks?.avg28?.mean?.toFixed(1) ?? '—'],
      ['Impressions', num(yTotals?.impressions), num(yMinus1Totals?.impressions),
        last7Avg ? num(Math.round(last7Avg.impressions)) : '—',
        baselineCompare?.impressions?.avg28?.mean ? num(Math.round(baselineCompare.impressions.avg28.mean)) : '—'],
      ['CTR', pct(yTotals?.ctr, 2), pct(yMinus1Totals?.ctr, 2),
        last7Avg ? pct(last7Avg.ctr, 2) : '—',
        baselineCompare?.ctr?.avg28?.mean ? pct(baselineCompare.ctr.avg28.mean, 2) : '—'],
      ['Avg position', yTotals?.position?.toFixed(1) ?? '—', yMinus1Totals?.position?.toFixed(1) ?? '—',
        last7Avg ? last7Avg.position.toFixed(1) : '—',
        baselineCompare?.position?.avg28?.mean?.toFixed(1) ?? '—'],
    ],
  ));

  // 2) Movers / droppers (page-level position change vs prior week)
  const movers = await collectPositionChanges({ today, baselineCompare });
  const topMovers = movers.improving.slice(0, 3);
  const topDroppers = movers.declining.slice(0, 3);

  if (topMovers.length > 0 || topDroppers.length > 0) {
    lines.push(h3('Position movers (yesterday vs prior week)'));
    if (topMovers.length > 0) {
      lines.push('**Improving:**');
      lines.push(table(
        ['Page', 'Prev pos', 'Now pos', 'Δ'],
        topMovers.map((m) => [m.page, m.before.toFixed(1), m.after.toFixed(1), `+${m.deltaPos.toFixed(1)}`]),
      ));
    }
    if (topDroppers.length > 0) {
      lines.push('**Declining:**');
      lines.push(table(
        ['Page', 'Prev pos', 'Now pos', 'Δ'],
        topDroppers.map((m) => [m.page, m.before.toFixed(1), m.after.toFixed(1), `${m.deltaPos.toFixed(1)}`]),
      ));
    }
  }

  // 3) Suspicious zero-CTR (top-10 position, 0 clicks, ≥100 impressions over 7d)
  const suspicious = await collectSuspiciousZeroCtr({ state, last7Start, last7End: last7End_ });
  if (suspicious.length > 0) {
    lines.push(h3('Suspicious zero-CTR (pos ≤10, ≥100 impressions, 0 clicks, last 7d)'));
    lines.push('Wrong-intent ranking or SERP feature suppression — investigate before recommending changes.');
    lines.push(table(
      ['Page', 'Impr.', 'Avg pos', 'Likely cause'],
      suspicious.slice(0, mode === 'quick' ? 5 : 15).map((s) => [
        s.page,
        num(s.impressions),
        s.position.toFixed(1),
        s.suppressed ? 'Local Pack suppression (denylisted)' : 'wrong-intent or SERP feature',
      ]),
    ));
  }

  // 4) Deep mode: brand vs non-brand split + CTR by position bucket
  let brandSplit = null;
  let ctrByBucket = null;
  if (mode !== 'quick') {
    brandSplit = await collectBrandSplit({ last7Start, last7End: last7End_ });
    if (brandSplit) {
      lines.push(h3('Brand vs non-brand (last 7 days)'));
      lines.push(table(
        ['Segment', 'Clicks', 'Impressions', 'CTR'],
        [
          ['Brand (contains "same day appliance repair")', num(brandSplit.brand.clicks), num(brandSplit.brand.impressions), pct(brandSplit.brand.ctr, 2)],
          ['Non-brand', num(brandSplit.nonBrand.clicks), num(brandSplit.nonBrand.impressions), pct(brandSplit.nonBrand.ctr, 2)],
        ],
      ));
    }
    ctrByBucket = await collectCtrByPositionBucket({ last7Start, last7End: last7End_ });
    if (ctrByBucket) {
      lines.push(h3('CTR by position bucket (last 7d)'));
      lines.push(table(
        ['Position bucket', 'Pages', 'Clicks', 'Impr.', 'CTR'],
        ctrByBucket.map((b) => [b.label, num(b.pages), num(b.clicks), num(b.impressions), pct(b.ctr, 2)]),
      ));
    }
  }

  // Health score
  const ctx = suppressionContext(state, today);
  const clicksTrend = baselineCompare?.clicks?.avg7?.mean
    ? (yTotals?.clicks - baselineCompare.clicks.avg7.mean) / Math.max(1, baselineCompare.clicks.avg7.mean)
    : null;
  // Benchmark CTR for local services org search ~2.5%; we're far below typically
  const ctrVsBenchmark = yTotals?.ctr ? yTotals.ctr / 0.025 : null;
  const positionTrend = baselineCompare?.position?.avg7?.mean
    ? (yTotals?.position - baselineCompare.position.avg7.mean)
    : null;
  const healthScore = ctx.baselineStillBuilding
    ? null // не считаем search score пока baseline не стабилизировался
    : searchHealth({ clicksTrend, ctrVsBenchmark, positionTrend });

  return {
    yesterdayClicks: yTotals?.clicks ?? null,
    yesterdayImpressions: yTotals?.impressions ?? null,
    yesterdayCtr: yTotals?.ctr ?? null,
    yesterdayPosition: yTotals?.position ?? null,
    last7Avg,
    suspiciousZeroCtrCount: suspicious.filter((s) => !s.suppressed).length,
    dropperCount: movers.declining.length,
    topMover: topMovers[0] || null,
    healthScore,
    markdown: lines.join('\n'),
    snapshotForBaseline: yTotals
      ? {
        date: yesterday,
        metrics: {
          clicks: yTotals.clicks,
          impressions: yTotals.impressions,
          ctr: yTotals.ctr,
          position: yTotals.position,
        },
      }
      : null,
  };
}

async function collectPositionChanges({ today }) {
  const yesterday = isoDateMinusDays(SC_LAG_DAYS, today);
  const last7Start = isoDateMinusDays(SC_LAG_DAYS + 6, today);
  const prevStart = isoDateMinusDays(SC_LAG_DAYS + 13, today);
  const prevEnd = isoDateMinusDays(SC_LAG_DAYS + 7, today);

  try {
    const [recent, prev] = await Promise.all([
      searchAnalytics({ startDate: last7Start, endDate: yesterday, dimensions: ['page'], rowLimit: 5000 }),
      searchAnalytics({ startDate: prevStart, endDate: prevEnd, dimensions: ['page'], rowLimit: 5000 }),
    ]);
    const prevMap = new Map();
    for (const r of (prev.rows || [])) prevMap.set(r.keys[0], r);

    const moves = [];
    for (const r of (recent.rows || [])) {
      const url = r.keys[0];
      const before = prevMap.get(url);
      if (!before) continue;
      if (r.impressions < 50 || before.impressions < 50) continue;
      const delta = before.position - r.position; // positive = improvement
      if (Math.abs(delta) < 1) continue;
      moves.push({ page: pathOf(url), before: before.position, after: r.position, deltaPos: delta });
    }
    return {
      improving: moves.filter((m) => m.deltaPos > 0).sort((a, b) => b.deltaPos - a.deltaPos),
      declining: moves.filter((m) => m.deltaPos < 0).sort((a, b) => a.deltaPos - b.deltaPos),
    };
  } catch {
    return { improving: [], declining: [] };
  }
}

async function collectSuspiciousZeroCtr({ state, last7Start, last7End }) {
  try {
    const resp = await searchAnalytics({ startDate: last7Start, endDate: last7End, dimensions: ['page'], rowLimit: 1000 });
    return (resp.rows || [])
      .map((r) => ({
        page: pathOf(r.keys[0]),
        clicks: r.clicks,
        impressions: r.impressions,
        position: r.position,
      }))
      .filter((r) => r.clicks === 0 && r.position <= 10 && r.impressions >= 100)
      .map((r) => ({ ...r, suppressed: denylistedPagePath(state, r.page) }))
      .sort((a, b) => b.impressions - a.impressions);
  } catch {
    return [];
  }
}

async function collectBrandSplit({ last7Start, last7End }) {
  try {
    const resp = await searchAnalytics({ startDate: last7Start, endDate: last7End, dimensions: ['query'], rowLimit: 25_000 });
    const brandRe = /same\s*day\s*appliance\s*repair/i;
    const brand = { clicks: 0, impressions: 0 };
    const nonBrand = { clicks: 0, impressions: 0 };
    for (const r of (resp.rows || [])) {
      const target = brandRe.test(r.keys[0]) ? brand : nonBrand;
      target.clicks += r.clicks;
      target.impressions += r.impressions;
    }
    return {
      brand: { ...brand, ctr: brand.impressions ? brand.clicks / brand.impressions : 0 },
      nonBrand: { ...nonBrand, ctr: nonBrand.impressions ? nonBrand.clicks / nonBrand.impressions : 0 },
    };
  } catch {
    return null;
  }
}

async function collectCtrByPositionBucket({ last7Start, last7End }) {
  try {
    const resp = await searchAnalytics({ startDate: last7Start, endDate: last7End, dimensions: ['page'], rowLimit: 5000 });
    const buckets = [
      { label: '1-3', min: 1, max: 3 },
      { label: '4-10', min: 4, max: 10 },
      { label: '11-20', min: 11, max: 20 },
      { label: '21-50', min: 21, max: 50 },
      { label: '51+', min: 51, max: Infinity },
    ].map((b) => ({ ...b, pages: 0, clicks: 0, impressions: 0 }));

    for (const r of (resp.rows || [])) {
      const b = buckets.find((bx) => r.position >= bx.min && r.position <= bx.max);
      if (!b) continue;
      b.pages += 1;
      b.clicks += r.clicks;
      b.impressions += r.impressions;
    }
    return buckets.map((b) => ({ ...b, ctr: b.impressions ? b.clicks / b.impressions : 0 }));
  } catch {
    return null;
  }
}
