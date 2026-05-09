import { runReport, rowsToObjects } from '../lib/ga4-client.js';
import { h2, h3, table, num, pct, callout, isoDateMinusDays } from '../lib/format.js';
import { suppressionContext } from '../lib/project-state.js';
import { behaviorHealth } from '../lib/health-score.js';
import { compareWindows } from '../lib/baseline.js';

export async function buildUserBehavior({ state, baseline, mode = 'quick', today = new Date() }) {
  const lines = [];
  lines.push(h2('User Behavior (GA4)'));

  const yesterday = isoDateMinusDays(1, today);
  const dayBeforeYesterday = isoDateMinusDays(2, today);
  const last7Start = isoDateMinusDays(7, today);
  const last7End = yesterday;

  // 1) Daily totals — three separate single-range queries (GA4 dateRange isn't a real dimension).
  const metrics = ['sessions', 'activeUsers', 'screenPageViews', 'engagedSessions', 'engagementRate', 'averageSessionDuration', 'eventCount'];
  let yToday = {};
  let yPrev = {};
  let week = {};
  try {
    const [a, b, c] = await Promise.all([
      runReport({ dateRanges: [{ startDate: yesterday, endDate: yesterday }], metrics }),
      runReport({ dateRanges: [{ startDate: dayBeforeYesterday, endDate: dayBeforeYesterday }], metrics }),
      runReport({ dateRanges: [{ startDate: last7Start, endDate: last7End }], metrics }),
    ]);
    yToday = rowsToObjects(a)[0] || {};
    yPrev = rowsToObjects(b)[0] || {};
    week = rowsToObjects(c)[0] || {};
  } catch (e) {
    lines.push(callout('warn', [`GA4 daily totals failed: ${e.message}`]));
    return {
      markdown: lines.join('\n'),
      healthScore: null,
      engagementRate: null,
    };
  }
  const week7Avg = week.sessions ? week.sessions / 7 : null;

  lines.push(h3('Yesterday vs trends'));
  lines.push(table(
    ['Metric', 'Yesterday', 'Day before', '7d avg', '7d total'],
    [
      ['Sessions', num(yToday.sessions), num(yPrev.sessions),
        week7Avg ? week7Avg.toFixed(1) : '—',
        num(week.sessions)],
      ['Active users', num(yToday.activeUsers), num(yPrev.activeUsers),
        week.activeUsers ? (week.activeUsers / 7).toFixed(1) : '—',
        num(week.activeUsers)],
      ['Page views', num(yToday.screenPageViews), num(yPrev.screenPageViews),
        week.screenPageViews ? (week.screenPageViews / 7).toFixed(1) : '—',
        num(week.screenPageViews)],
      ['Engagement rate', pct(yToday.engagementRate, 1), pct(yPrev.engagementRate, 1),
        pct(week.engagementRate, 1), '—'],
      ['Avg session duration', `${(yToday.averageSessionDuration || 0).toFixed(0)}s`,
        `${(yPrev.averageSessionDuration || 0).toFixed(0)}s`,
        `${(week.averageSessionDuration || 0).toFixed(0)}s`, '—'],
    ],
  ));

  // 2) Top pages by sessions (last 7d)
  let topPages = [];
  try {
    const r = await runReport({
      dateRanges: [{ startDate: last7Start, endDate: last7End }],
      dimensions: ['pagePath'],
      metrics: ['sessions', 'activeUsers', 'screenPageViews', 'engagementRate'],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: mode === 'quick' ? 5 : 20,
    });
    topPages = rowsToObjects(r);
  } catch (e) {
    lines.push(callout('warn', [`GA4 top pages failed: ${e.message}`]));
  }

  if (topPages.length > 0) {
    lines.push(h3(`Top pages by sessions (last 7 days, top ${mode === 'quick' ? 5 : 20})`));
    lines.push(table(
      ['Page', 'Sessions', 'Users', 'Views', 'Engagement'],
      topPages.map((p) => [p.pagePath, num(p.sessions), num(p.activeUsers), num(p.screenPageViews), pct(p.engagementRate, 1)]),
    ));
  }

  // 3) Booking funnel: arrivals → /book/ → submit
  let funnel = null;
  try {
    const arrivalsResp = await runReport({
      dateRanges: [{ startDate: last7Start, endDate: last7End }],
      metrics: ['sessions'],
    });
    const arrivals = rowsToObjects(arrivalsResp)[0]?.sessions ?? 0;

    const bookResp = await runReport({
      dateRanges: [{ startDate: last7Start, endDate: last7End }],
      dimensions: ['pagePath'],
      metrics: ['screenPageViews'],
      dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: '/book/' } } },
    });
    const bookViews = rowsToObjects(bookResp)[0]?.screenPageViews ?? 0;

    const submitResp = await runReport({
      dateRanges: [{ startDate: last7Start, endDate: last7End }],
      dimensions: ['eventName'],
      metrics: ['eventCount'],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'book_now' } } },
    });
    const submits = rowsToObjects(submitResp)[0]?.eventCount ?? 0;

    funnel = { arrivals, bookViews, submits };
  } catch (e) {
    // continue
  }

  if (funnel) {
    lines.push(h3('Booking funnel (last 7 days)'));
    const arrivalToBook = funnel.arrivals ? funnel.bookViews / funnel.arrivals : 0;
    const bookToSubmit = funnel.bookViews ? funnel.submits / funnel.bookViews : 0;
    const overall = funnel.arrivals ? funnel.submits / funnel.arrivals : 0;
    lines.push(table(
      ['Stage', 'Count', 'Conversion'],
      [
        ['Site arrivals (sessions)', num(funnel.arrivals), '—'],
        ['Visited /book/', num(funnel.bookViews), pct(arrivalToBook, 2)],
        ['book_now event', num(funnel.submits), pct(bookToSubmit, 2)],
        ['Overall (arrivals → submit)', '—', pct(overall, 2)],
      ],
    ));
  }

  // 4) Deep mode: channel + geo + device + session distribution
  if (mode !== 'quick') {
    const [channels, geo, devices, exits] = await Promise.all([
      runReport({
        dateRanges: [{ startDate: last7Start, endDate: last7End }],
        dimensions: ['sessionDefaultChannelGroup'],
        metrics: ['sessions', 'activeUsers', 'engagementRate'],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }).then(rowsToObjects).catch(() => []),
      runReport({
        dateRanges: [{ startDate: last7Start, endDate: last7End }],
        dimensions: ['city'],
        metrics: ['sessions', 'engagementRate'],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }).then(rowsToObjects).catch(() => []),
      runReport({
        dateRanges: [{ startDate: last7Start, endDate: last7End }],
        dimensions: ['deviceCategory'],
        metrics: ['sessions', 'engagementRate', 'averageSessionDuration'],
      }).then(rowsToObjects).catch(() => []),
      runReport({
        dateRanges: [{ startDate: last7Start, endDate: last7End }],
        dimensions: ['pagePath'],
        metrics: ['exits', 'screenPageViews'],
        orderBys: [{ metric: { metricName: 'exits' }, desc: true }],
        limit: 10,
      }).then(rowsToObjects).catch(() => []),
    ]);

    if (channels.length > 0) {
      lines.push(h3('Channel performance (last 7d)'));
      lines.push(table(
        ['Channel', 'Sessions', 'Users', 'Engagement'],
        channels.map((c) => [c.sessionDefaultChannelGroup, num(c.sessions), num(c.activeUsers), pct(c.engagementRate, 1)]),
      ));
    }
    if (geo.length > 0) {
      lines.push(h3('Geo (top 15 cities by sessions)'));
      lines.push(table(
        ['City', 'Sessions', 'Engagement'],
        geo.map((g) => [g.city, num(g.sessions), pct(g.engagementRate, 1)]),
      ));
    }
    if (devices.length > 0) {
      lines.push(h3('Devices'));
      lines.push(table(
        ['Device', 'Sessions', 'Engagement', 'Avg duration'],
        devices.map((d) => [d.deviceCategory, num(d.sessions), pct(d.engagementRate, 1), `${(d.averageSessionDuration || 0).toFixed(0)}s`]),
      ));
    }
    if (exits.length > 0) {
      lines.push(h3('Top exit pages'));
      lines.push(table(
        ['Page', 'Exits', 'Page views', 'Exit rate'],
        exits.map((e) => [e.pagePath, num(e.exits), num(e.screenPageViews),
          e.screenPageViews ? pct(e.exits / e.screenPageViews, 1) : '—']),
      ));
    }
  }

  // Health score
  const ctx = suppressionContext(state, today);
  const sessionsTrend = week7Avg
    ? (yToday.sessions - week7Avg) / Math.max(1, week7Avg)
    : null;
  const healthScore = ctx.baselineStillBuilding
    ? null
    : behaviorHealth({ engagementRate: yToday.engagementRate ?? null, sessionsTrend });

  return {
    markdown: lines.join('\n'),
    healthScore,
    engagementRate: yToday.engagementRate ?? null,
    sessions: yToday.sessions ?? null,
    snapshotForBaseline: yToday.sessions !== undefined
      ? {
        date: yesterday,
        metrics: {
          sessions: yToday.sessions,
          activeUsers: yToday.activeUsers,
          pageViews: yToday.screenPageViews,
          engagementRate: yToday.engagementRate,
        },
      }
      : null,
  };
}
