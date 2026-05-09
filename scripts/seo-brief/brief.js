#!/usr/bin/env node
// SEO/Analytics daily briefing for sdar-v2.
//
// Usage:
//   node scripts/seo-brief/brief.js                    quick brief (default)
//   node scripts/seo-brief/brief.js --deep             full report (all sections deep)
//   node scripts/seo-brief/brief.js --focus indexation  only indexation, deep
//   node scripts/seo-brief/brief.js --focus search     only search performance
//   node scripts/seo-brief/brief.js --focus behavior   only user behavior
//
// Output:
//   - terminal: executive summary + section summaries (quick) or full markdown (deep/focus)
//   - file: <wiki>/briefings/YYYY-MM-DD-HHMM.md (always full content)
//
// Notes:
//   - GSC has 2-3 day reporting lag; "yesterday" effectively = today-3 in this script.
//   - Sections run independently; one failing section does not block the others.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { loadProjectState } from './lib/project-state.js';
import { getBaseline, appendSnapshot } from './lib/baseline.js';
import { BRIEFINGS_DIR } from './lib/paths.js';
import { timestamp, color, h2, callout } from './lib/format.js';
import { buildExecutiveSummary } from './sections/executive-summary.js';
import { buildIndexation } from './sections/indexation.js';
import { buildSearchPerformance } from './sections/search-performance.js';
import { buildUserBehavior } from './sections/user-behavior.js';
import { buildRecommendations } from './sections/recommendations.js';

function parseArgs(argv) {
  const args = { mode: 'quick', focus: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--deep') args.mode = 'deep';
    else if (a === '--focus') {
      args.focus = argv[i + 1];
      args.mode = 'deep';
      i += 1;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function help() {
  console.log(`Usage: node scripts/seo-brief/brief.js [options]

  --deep                    Full report (all sections, deep variant)
  --focus <section>         Only one section, deep. Sections: indexation, search, behavior
  -h, --help                Show this help

Default (no flags) produces a quick brief — executive summary + condensed sections.
Saves full report to <wiki>/briefings/YYYY-MM-DD-HHMM.md regardless of flags.`);
}

async function safeRun(name, fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    return { ok: false, error: err, markdown: callout('fail', [`${name} failed: ${err.message}`]) };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { help(); return; }

  const today = new Date();
  const ts = timestamp(today);

  console.log(color('cyan', '\n[seo-brief] Loading project state…'));
  const state = await loadProjectState();
  const baseline = await getBaseline().catch(() => ({ snapshots: [] }));
  console.log(color('dim', `[seo-brief] Mode: ${args.mode}${args.focus ? ` · focus=${args.focus}` : ''}`));
  console.log(color('dim', `[seo-brief] State events: ${state.events?.length || 0} · Baseline samples: ${baseline.snapshots?.length || 0}`));

  const sections = {};
  const focus = args.focus;

  // Run sections
  if (!focus || focus === 'indexation') {
    console.log(color('dim', '[seo-brief] Running indexation…'));
    const r = await safeRun('Indexation', () => buildIndexation({ state, mode: args.mode, today }));
    sections.indexation = r.ok ? r.value : { markdown: r.markdown, healthScore: null };
  }
  if (!focus || focus === 'search') {
    console.log(color('dim', '[seo-brief] Running search performance…'));
    const r = await safeRun('Search Performance', () => buildSearchPerformance({ state, baseline, mode: args.mode, today }));
    sections.search = r.ok ? r.value : { markdown: r.markdown, healthScore: null };
  }
  if (!focus || focus === 'behavior') {
    console.log(color('dim', '[seo-brief] Running user behavior…'));
    const r = await safeRun('User Behavior', () => buildUserBehavior({ state, baseline, mode: args.mode, today }));
    sections.behavior = r.ok ? r.value : { markdown: r.markdown, healthScore: null };
  }

  // Recommendations only if running full brief (skip on focus)
  if (!focus) {
    console.log(color('dim', '[seo-brief] Building recommendations…'));
    const r = await safeRun('Recommendations', () => buildRecommendations({
      state,
      indexation: sections.indexation,
      search: sections.search,
      behavior: sections.behavior,
      today,
    }));
    sections.recommendations = r.ok ? r.value : { markdown: r.markdown };
  }

  // Update baseline with snapshots from this run
  const todaySnapshot = { date: ts.iso, metrics: {} };
  if (sections.search?.snapshotForBaseline) {
    Object.assign(todaySnapshot.metrics, sections.search.snapshotForBaseline.metrics);
    todaySnapshot.date = sections.search.snapshotForBaseline.date;
  }
  if (sections.behavior?.snapshotForBaseline) {
    Object.assign(todaySnapshot.metrics, sections.behavior.snapshotForBaseline.metrics);
  }
  if (sections.indexation?.indexed !== null && sections.indexation?.indexed !== undefined) {
    todaySnapshot.metrics.indexedPages = sections.indexation.indexed;
    todaySnapshot.metrics.submittedPages = sections.indexation.submitted;
  }
  if (Object.keys(todaySnapshot.metrics).length > 0) {
    await appendSnapshot(todaySnapshot).catch((e) => console.warn('[seo-brief] baseline append failed:', e.message));
  }

  // Compute net change for indexation (after baseline append)
  if (sections.indexation && baseline.snapshots) {
    const prevSnapshot = [...baseline.snapshots].reverse().find((s) => s.date < ts.iso && s.metrics?.indexedPages !== undefined);
    const prevWeekSnapshot = [...baseline.snapshots].reverse().find((s) => {
      const ageMs = new Date(ts.iso).getTime() - new Date(s.date).getTime();
      const days = ageMs / 86_400_000;
      return days >= 7 && s.metrics?.indexedPages !== undefined;
    });
    if (prevSnapshot && sections.indexation.indexed !== null) {
      sections.indexation.netChange24h = sections.indexation.indexed - prevSnapshot.metrics.indexedPages;
    }
    if (prevWeekSnapshot && sections.indexation.indexed !== null) {
      sections.indexation.netChange7d = sections.indexation.indexed - prevWeekSnapshot.metrics.indexedPages;
    }
  }

  // Build executive summary (depends on section results)
  const summary = focus
    ? null
    : buildExecutiveSummary({
      state,
      indexation: sections.indexation,
      search: sections.search,
      behavior: sections.behavior,
    });

  // Compose full markdown for file output
  const fullParts = [];
  if (summary) fullParts.push(summary.markdown);
  if (sections.indexation?.markdown) fullParts.push(sections.indexation.markdown);
  if (sections.search?.markdown) fullParts.push(sections.search.markdown);
  if (sections.behavior?.markdown) fullParts.push(sections.behavior.markdown);
  if (sections.recommendations?.markdown) fullParts.push(sections.recommendations.markdown);
  const fullMarkdown = fullParts.join('\n\n');

  // Save to file
  const fileName = `${ts.file}${focus ? `-${focus}` : (args.mode === 'deep' ? '-deep' : '')}.md`;
  const outPath = `${BRIEFINGS_DIR.replaceAll('\\', '/')}/${fileName}`;
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, fullMarkdown, 'utf8');

  // Terminal output
  console.log('');
  if (args.mode === 'quick' && summary) {
    console.log(summary.markdown);
    console.log('');
    console.log(color('bold', 'Section summaries (run --deep for full):'));
    if (sections.indexation) {
      const i = sections.indexation;
      console.log(`  Indexation: ${num(i.indexed)} indexed of ${num(i.submitted)} submitted (GSC view)${sections.indexation.coverageSnapshotStale ? ' · ⚠ snapshot stale' : ''}`);
    }
    if (sections.search) console.log(`  Search: ${num(sections.search.yesterdayClicks)} clicks · ${num(sections.search.yesterdayImpressions)} impressions · CTR ${pctStr(sections.search.yesterdayCtr)}`);
    if (sections.behavior) console.log(`  Behavior: ${num(sections.behavior.sessions)} sessions · engagement ${pctStr(sections.behavior.engagementRate)}`);
    console.log('');
    console.log(color('dim', `Saved: ${outPath}`));
    console.log(color('dim', 'Run with --deep for full report. Run with --focus indexation|search|behavior to drill into one section.'));
  } else {
    console.log(fullMarkdown);
    console.log('');
    console.log(color('dim', `Saved: ${outPath}`));
  }
}

function num(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US');
}
function pctStr(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

main().catch((err) => {
  console.error('[seo-brief] fatal:', err);
  process.exit(1);
});
