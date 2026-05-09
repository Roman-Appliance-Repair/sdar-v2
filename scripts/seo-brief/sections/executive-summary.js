import { color, h1, h2, callout, num, pct } from '../lib/format.js';
import { compositeHealth, scoreLabel } from '../lib/health-score.js';
import { suppressionContext } from '../lib/project-state.js';

export function buildExecutiveSummary({ state, indexation, search, behavior }) {
  const ctx = suppressionContext(state);
  const indexationScore = indexation?.healthScore ?? null;
  const searchScore = search?.healthScore ?? null;
  const behaviorScore = behavior?.healthScore ?? null;
  const composite = compositeHealth({
    indexation: indexationScore,
    search: searchScore,
    behavior: behaviorScore,
    settling: ctx.baselineStillBuilding,
  });

  const lines = [];
  lines.push(h1('SEO/Analytics Daily Briefing'));
  lines.push(`*Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · GA4 ${state.ga4Property} · ${state.gscProperty}*`);
  lines.push('');

  // Project state callout — always visible, drives all interpretation
  const stateLines = [];
  if (ctx.daysSinceCutover !== null) {
    stateLines.push(`Project state: ${ctx.daysSinceCutover} days post-cutover (DNS swap 2026-05-06).`);
  }
  if (ctx.schemaImpactSettling) {
    stateLines.push(`Schema sweep deployed ${ctx.daysSinceSchema}d ago — impact still settling.`);
  }
  if (ctx.photosMissing) {
    stateLines.push('Photos pipeline pending — site has no images. CTR/engagement signals impacted.');
  }
  if (ctx.baselineStillBuilding) {
    stateLines.push(`Baseline still building. Comparisons against pre-2026-05-06 are NOT meaningful (different site).`);
  }
  if (stateLines.length > 0) {
    lines.push(callout('info', stateLines));
    lines.push('');
  }

  lines.push(h2('Executive Summary'));

  // 1. Главное изменение
  const mainChange = pickMainChange({ indexation, search, behavior });
  lines.push(`**Главное изменение vs вчера:** ${mainChange}`);

  // 2. Главный вопрос дня
  const mainQuestion = pickMainQuestion({ indexation, search, behavior, ctx });
  lines.push(`**Главный вопрос дня:** ${mainQuestion}`);

  // 3. Главная победа
  const mainWin = pickMainWin({ indexation, search, behavior });
  lines.push(`**Главная победа:** ${mainWin}`);

  // 4. Health score
  let scoreText;
  if (composite === null) {
    scoreText = ctx.baselineStillBuilding
      ? 'baseline still building (search/behavior trends not meaningful until ~2026-06-03)'
      : 'n/a (insufficient data)';
  } else {
    scoreText = `${composite}/100 — ${scoreLabel(composite)}${ctx.baselineStillBuilding ? ' (capped at 75 while baseline settles)' : ''}`;
  }
  lines.push(`**Health score:** ${scoreText}`);
  if (indexationScore !== null || searchScore !== null || behaviorScore !== null) {
    const breakdown = [
      indexationScore !== null ? `indexation ${Math.round(indexationScore)}` : null,
      searchScore !== null ? `search ${Math.round(searchScore)}` : null,
      behaviorScore !== null ? `behavior ${Math.round(behaviorScore)}` : null,
    ].filter(Boolean).join(' · ');
    lines.push(`> ${breakdown}`);
  }

  // 5. Worth investigating
  const watch = collectWatchItems({ indexation, search, behavior, ctx });
  lines.push('**Worth investigating:**');
  if (watch.length === 0) {
    lines.push('- (nothing flagged this run)');
  } else {
    watch.slice(0, 3).forEach((w) => lines.push(`- ${w}`));
  }

  return { score: composite, markdown: lines.join('\n') };
}

function pickMainChange({ indexation, search }) {
  if (indexation?.netChange24h !== null && indexation?.netChange24h !== undefined) {
    const sign = indexation.netChange24h > 0 ? '+' : '';
    if (indexation.netChange24h !== 0) {
      return `Indexed pages ${sign}${indexation.netChange24h} (${num(indexation.indexed)}/${num(indexation.submitted)} of sitemap).`;
    }
  }
  if (search?.yesterdayClicks !== null) {
    return `Yesterday ${num(search.yesterdayClicks)} clicks · ${num(search.yesterdayImpressions)} impressions · pos ${search.yesterdayPosition?.toFixed(1) || '—'}.`;
  }
  return 'No notable shifts (data sparse).';
}

function pickMainQuestion({ indexation, search, ctx }) {
  if (indexation?.indexedPct !== null && indexation?.expectedPct !== null) {
    const lag = indexation.expectedPct - (indexation.indexedPct * 100);
    if (lag > 10) {
      return `Indexation is ${lag.toFixed(0)}pp behind expected curve — Google не успевает за sitemap. Что бустить?`;
    }
  }
  if (search?.suspiciousZeroCtrCount > 0) {
    return `${search.suspiciousZeroCtrCount} страниц с position ≤10 и 0 кликов — wrong-intent ranking или SERP feature suppression?`;
  }
  if (ctx.daysSinceCutover !== null && ctx.daysSinceCutover < 14) {
    return 'Слишком рано для содержательных выводов по трендам — данные ещё стабилизируются.';
  }
  return 'Где приоритизировать ручной запрос индексации сегодня?';
}

function pickMainWin({ indexation, search, behavior }) {
  if (search?.topMover) {
    return `${search.topMover.page} → pos ${search.topMover.before?.toFixed(1)} → ${search.topMover.after?.toFixed(1)} (${search.topMover.deltaPos > 0 ? '+' : ''}${search.topMover.deltaPos.toFixed(1)})`;
  }
  if (indexation?.newlyIndexedSample?.length > 0) {
    return `${indexation.newlyIndexedSample.length} новых страниц проиндексировано: ${indexation.newlyIndexedSample[0]}…`;
  }
  if (behavior?.engagementRate && behavior.engagementRate > 0.5) {
    return `Engagement rate ${pct(behavior.engagementRate)} — выше бенчмарка для local services.`;
  }
  return '(нет явных побед — собираем данные)';
}

function collectWatchItems({ indexation, search, ctx }) {
  const items = [];
  if (indexation?.stuckDiscovered?.length > 0) {
    items.push(`${indexation.stuckDiscovered.length} страниц >14d в "Discovered, not indexed" — кандидаты на content review`);
  }
  if (indexation?.coverageSnapshotStale) {
    items.push('coverage-snapshot.json устарел >14d — обновить из GSC UI');
  }
  if (search?.dropperCount > 0) {
    items.push(`${search.dropperCount} страниц упали по позиции на ≥3 за неделю`);
  }
  if (search?.suspiciousZeroCtrCount > 0) {
    items.push(`${search.suspiciousZeroCtrCount} страниц "position 1-10, 0 clicks" — wrong-intent или SERP suppression`);
  }
  if (ctx.daysSinceSchema !== null && ctx.daysSinceSchema < 14) {
    items.push(`schema sweep ${ctx.daysSinceSchema}d ago — schema-related изменения подождать ещё ${14 - ctx.daysSinceSchema}d`);
  }
  return items;
}
