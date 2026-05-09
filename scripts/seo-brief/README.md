# SEO/Analytics Briefing

Daily briefing system for sdar-v2. Reads GSC + GA4 + sitemap + manual snapshots, produces a structured Markdown report. Generated **on demand** (no cron) — Roman runs it when he wants.

## Usage

```bash
# Quick brief (default) — executive summary + condensed sections
node scripts/seo-brief/brief.js

# Full deep report — all sections, deep variants
node scripts/seo-brief/brief.js --deep

# Drill into one section
node scripts/seo-brief/brief.js --focus indexation
node scripts/seo-brief/brief.js --focus search
node scripts/seo-brief/brief.js --focus behavior
```

Every run prints to terminal AND saves the full report to `<wiki>/briefings/YYYY-MM-DD-HHMM[-deep|-focus].md`.

The wiki is in a separate private repo at `C:\Users\Roman\projects\sdar-v2-wiki\sdar-v2-wiki\briefings/`. Briefing reports + state files live there; the script that produces them lives here in `sdar-v2`.

## Sections

| # | Section | What it covers |
|---|---|---|
| 1 | Executive Summary | Main change vs yesterday · main question of the day · biggest win · health score 0-100 · 2-3 things worth investigating |
| 2 | Indexation Health | Sitemap submitted/indexed · expected vs actual indexation curve · coverage breakdown (manual snapshot) · stuck pages · priority manual indexing list (top 10 copy/paste-ready) · manual request tracking |
| 3 | Search Performance | Yesterday clicks/impressions/CTR/position · vs 7d & 28d avg · top 3 movers/droppers · suspicious zero-CTR pages · brand vs non-brand split · CTR by position bucket (deep) |
| 4 | User Behavior | Sessions/users/engagement/duration · top pages · booking funnel (arrivals → /book/ → submit) · channels/geo/devices/exits (deep) |
| 5 | Recommendations | Max 5 prioritised observations with evidence + suggested action. Filtered by cooling list, denylist, and active suppression rules from project-state.json |

## Health Score

Composite 0-100 from three sub-scores:

| Sub-score | Weight | Inputs |
|---|---|---|
| Indexation | 40% | indexedPct vs expectedPct (timeline in project-state.json) |
| Search | 35% | clicks trend vs 7d, CTR vs 2.5% benchmark, position trend |
| Behavior | 25% | engagementRate vs 0.45 benchmark, sessions trend |

| Range | Label |
|---|---|
| 85-100 | strong |
| 70-84 | healthy |
| 55-69 | mixed |
| 40-54 | attention |
| 0-39 | critical |

**During the first 28 days post-cutover (until 2026-06-03), the score is capped at 75** because pre-cutover data is from a different site and trends aren't meaningful yet.

## Project state awareness

`<wiki>/briefings/project-state.json` is the source of truth for "what major events happened recently." Briefing reads it on every run and uses it to:

- Suppress recommendations that contradict ongoing context (e.g. don't recommend "improve CTR" while `photos_missing=true`).
- Mark observations as "settling" if the relevant event was <14 days ago (schema sweep) or <28 days ago (cutover).
- Compute expected indexation curve to compare against actual.

Update `project-state.json` manually when major events occur. The briefing always shows the active suppression rules in the Executive Summary callout, so suppressions are visible.

## Suppression rules (current)

| Condition | Effect |
|---|---|
| `photos_missing: true` | No "improve CTR" / "improve engagement" recommendations — main cause is no images, not page copy |
| `daysSinceSchemaSweep < 14` | No schema-related recommendations; observations marked "schema impact still settling" |
| `daysSinceCutover < 28` | No structural-change recommendations on basis of metrics; only critical issues (errors, broken pages) |
| Page in `cooling.json` with status `cooling` and within window | Excluded from recommendations |
| Page in `cooling.json` with status `active` | Always excluded ("in active development") |
| Page in `denylist.local_pack_suppressed_pages` | Excluded from CTR-related recommendations (Local Pack eats organic clicks) |

## Acceleration tooling

```bash
# IndexNow batch ping — sends URLs changed in last 7d to Bing/Yandex/Naver/Seznam
node scripts/indexnow-ping.js                # 7-day window
node scripts/indexnow-ping.js --days 14      # custom window
node scripts/indexnow-ping.js --all          # whole sitemap (cap 10k)
node scripts/indexnow-ping.js --dry-run      # preview, don't send
```

History is logged to `<wiki>/briefings/indexnow-log.json`.

For Google specifically (which ignores IndexNow), the briefing produces a **priority manual indexing list** — top 10 high-priority URLs not yet receiving GSC impressions. Copy from the brief, paste into GSC URL Inspection, click Request Indexing. Then log the batch in `manual-index-requests.json` so the briefing can track request → indexed latency over time.

## Credentials

The script reuses existing credentials — nothing new to set up:

| API | Auth | Path |
|---|---|---|
| GA4 Data API | Service account | `secrets/sdar-analytics-65ba2e820adb.json` |
| GSC API (Search Analytics + Sitemaps + URL Inspection) | OAuth user (refresh token cached) | `%LOCALAPPDATA%\mcp-gsc\mcp-gsc\token.json` |
| GSC OAuth client | OAuth Desktop client | `~/.gsc/client_secrets.json` |
| IndexNow | Public key in `public/{key}.txt` | (no secret) |

Both GSC token and the OAuth client secrets file are gitignored.

## Architecture

```
scripts/seo-brief/
  brief.js                    main entry point
  lib/
    paths.js                  all paths and IDs in one place
    project-state.js          loads/queries project-state.json
    ga4-client.js             googleapis wrapper for GA4
    gsc-client.js             googleapis wrapper for GSC + URL Inspection
    sitemap.js                sitemap-index → URL list with lastmod
    baseline.js               rolling 30-day metric snapshots
    cooling.js                page-level cooling status
    health-score.js           score calculations
    format.js                 ANSI colors, markdown helpers, tables
  sections/
    executive-summary.js      header + 5-line summary + worth-investigating list
    indexation.js             sitemap totals + coverage + priority list + stuck
    search-performance.js     GSC daily totals + movers + suspicious zero-CTR
    user-behavior.js          GA4 daily totals + funnel + channels/geo/devices
    recommendations.js        max 5 actionable observations
  README.md (this file)
  SAMPLE.md (sample brief output)
```

## Failure handling

Each section runs independently in a try/catch wrapper. If GA4 fails, search and indexation still produce output. The failed section emits a single warning callout in its place. The composite health score uses only the sub-scores that succeeded.

## Quirks worth knowing

- **GSC reporting lag is 2-3 days.** "Yesterday" in the Search section = today minus 2. The brief states this explicitly in every run.
- **GSC API does NOT expose Coverage breakdown** by reason. Only Sitemaps API totals + per-URL Inspection (quota 2000/day). For the breakdown shown in GSC UI Pages report, briefing reads `briefings/coverage-snapshot.json` — Roman updates this manually weekly. Briefing warns if stale >14 days.
- **GSC API ignores `orderBy`** in Search Analytics queries — results come back ordered by clicks descending. Briefing client-sorts by impressions where needed.
- **GA4 data has its own ~3-hour delay.** Same-day numbers stabilise late evening US/Pacific.
