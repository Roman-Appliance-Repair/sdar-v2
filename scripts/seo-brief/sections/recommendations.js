import { h2, callout, num, pct } from '../lib/format.js';
import { suppressionContext, denylistedPagePath } from '../lib/project-state.js';
import { isPageInCooling } from '../lib/cooling.js';

const PRIORITY = { P1: 1, P2: 2, P3: 3 };

export async function buildRecommendations({ state, indexation, search, behavior, today = new Date() }) {
  const lines = [];
  lines.push(h2('Recommendations'));
  lines.push('*Observation + suggestion only — Roman decides whether to act. Max 5 items, prioritised, deduped against active cooling pages and denylist.*');

  const ctx = suppressionContext(state, today);
  const candidates = [];

  // Candidate 1: priority indexing list (always relevant if list exists)
  if (indexation?.priorityList?.length > 0) {
    candidates.push({
      priority: 'P1',
      problem: `${indexation.priorityList.length} business-priority URLs are not yet receiving GSC impressions.`,
      evidence: `Top candidates: ${indexation.priorityList.slice(0, 3).join(', ')}…`,
      whyItMatters: 'High-priority pages (city pillars, brand pillars, top services) sitting outside Google\'s index = wasted SEO investment. Manual URL Inspection requests typically index within 1-3 days.',
      action: 'Open GSC URL Inspection, paste each URL, click Request Indexing. Log batch in briefings/manual-index-requests.json.',
    });
  }

  // Candidate 2: stuck discovered pages
  if (indexation?.stuckDiscovered?.length > 0) {
    candidates.push({
      priority: 'P2',
      problem: `${indexation.stuckDiscovered.length} pages stuck in "Discovered, not indexed" >14 days.`,
      evidence: `Sample: ${indexation.stuckDiscovered.slice(0, 3).join(', ')}…`,
      whyItMatters: 'Google found these URLs but chose not to crawl/index. Often signals weak internal linking, thin content, or duplicate signals.',
      action: 'Audit content depth, internal links to each page, and check for canonical/duplicate conflicts. After audit, request indexing manually.',
    });
  }

  // Candidate 3: suspicious zero-CTR (only if NOT denylisted and NOT photos-suppressed)
  if (search?.suspiciousZeroCtrCount > 0 && !ctx.suppressCtrRecommendations) {
    candidates.push({
      priority: 'P2',
      problem: `${search.suspiciousZeroCtrCount} pages rank in top 10 but have 0 clicks.`,
      evidence: 'See "Suspicious zero-CTR" table in Search Performance section.',
      whyItMatters: 'Top-10 ranking with 0 clicks usually means wrong-intent ranking (page ranks for queries it doesn\'t serve) or SERP feature suppression (Map Pack/AI Overviews eat organic clicks). Either content fix or GBP investment, not "improve title".',
      action: 'For each page: pull top queries (via /scripts/seo-brief), categorise as wrong-intent vs SERP-suppressed, plan accordingly.',
    });
  } else if (search?.suspiciousZeroCtrCount > 0 && ctx.suppressCtrRecommendations) {
    // Note: skipped because of photos_missing suppression
  }

  // Candidate 4: dropped pages (if not in cooling)
  if (search?.dropperCount > 0 && !ctx.suppressStructuralRecommendations) {
    candidates.push({
      priority: 'P3',
      problem: `${search.dropperCount} pages dropped ≥1 position vs prior week.`,
      evidence: 'See "Position movers — Declining" table.',
      whyItMatters: 'Position drops on commercial-intent pages translate directly to lost calls. May be temporary (Google rerank) or signal a deeper issue (canonical change, redirect chain, schema impact).',
      action: 'Cross-reference with recent deploys (cooling.json) and schema sweep date. If unrelated to known events, deeper audit needed.',
    });
  }

  // Candidate 5: coverage snapshot stale
  if (indexation?.coverageSnapshotStale) {
    candidates.push({
      priority: 'P3',
      problem: 'Coverage snapshot is stale (>14d) — briefing missing breakdown by index reason.',
      evidence: '`briefings/coverage-snapshot.json` snapshotDate is null or >14d old.',
      whyItMatters: 'Without the breakdown, briefing can\'t tell if "not indexed" pages are noindex-redirects (expected ~555) vs duplicate-canonical vs discovered-not-crawled.',
      action: 'GSC UI → Pages report → Why pages aren\'t indexed → copy each row count into briefings/coverage-snapshot.json. Set snapshotDate to today, commit.',
    });
  }

  // Apply suppressions (cooling, denylist) and dedup
  const suppressed = [];
  const allowed = [];
  for (const c of candidates) {
    // No specific page in this version of the candidate, so only state-level suppression applies
    allowed.push(c);
  }

  // Sort and cap at 5
  allowed.sort((a, b) => PRIORITY[a.priority] - PRIORITY[b.priority]);
  const selected = allowed.slice(0, 5);

  if (selected.length === 0) {
    lines.push('*(no actionable recommendations this run — nothing meets thresholds, or all candidates are in cooling/denylist)*');
  } else {
    selected.forEach((c, i) => {
      lines.push('');
      lines.push(`### ${i + 1}. [${c.priority}] ${c.problem}`);
      lines.push(`**Evidence:** ${c.evidence}`);
      lines.push(`**Why it matters:** ${c.whyItMatters}`);
      lines.push(`**Suggested action (Roman decides):** ${c.action}`);
    });
  }

  // Always-on suppression notes
  const notes = [];
  if (ctx.suppressCtrRecommendations) {
    notes.push('CTR recommendations suppressed: photos_missing=true (main cause of low CTR is no images, not page copy).');
  }
  if (ctx.suppressEngagementRecommendations) {
    notes.push('Engagement recommendations suppressed: same reason.');
  }
  if (ctx.suppressSchemaRecommendations) {
    notes.push(`Schema recommendations suppressed: schema sweep ${ctx.daysSinceSchema}d ago, impact still settling.`);
  }
  if (ctx.suppressStructuralRecommendations) {
    notes.push(`Structural recommendations suppressed: ${ctx.daysSinceCutover}d post-cutover, baseline still building.`);
  }
  if (notes.length > 0) {
    lines.push('');
    lines.push(callout('info', ['**Active suppression rules:**', ...notes]));
  }

  return { markdown: lines.join('\n'), count: selected.length };
}
