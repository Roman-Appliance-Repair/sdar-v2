# Work Status Audit — 2026-04-28

**Branch audited:** `refactor/services-multi-county-hubs` (compared to `main`)
**Read-only audit. No edits, no commits, no pushes.**

## Branch state

- **Main vs refactor:** 23 commits ahead on `refactor/services-multi-county-hubs`
- **Files changed:** 195
- **Lines changed:** +68,575 / −47,791

### Phase 3 commits (services rewrite)

| Commit | Description |
|--------|-------------|
| `e897a87` | components: neutral multi-county defaults + BranchesBlock |
| `9fd4f51` | services/refrigerator: neutral multi-county hub (Phase 3 pilot) |
| `f19c3a7` | T9 prerequisite: NAP & Rating Policy SSOT compliance fix |
| `0a49ba8` | services/{washer,dryer,stove}: neutral multi-county hub (batch 2) |
| `fda737c` | services/wine-cooler + commercial/walk-in-cooler + exhaust-hood (batch 3) |
| `668e70b` | services: remove aggregateRating from batch 1+2 schemas (SSOT cleanup) |

### City migration commits (T8/T9)

`3b5e589` (T8 components/tokens) → `a6c05a4` (T8 west-hollywood reference) → `c41bfa2` (T8 pilot 3) → `bdb225c` → `c5606b6` → `88b5135` → `11e9f77` → `63bdb8c` → `b31ee96` → `4f153a7` → `82ce391` → `736748e` → `743a5ed` → `9514aac` → `f98b640` → `2ad19af` (T9 batch 9 FINAL claim)

## Services pages

### Tier 1 — expected DONE (7/7)

| Page | Title | Phone | Schema | aggR JSON-LD | Body rating | Status |
|------|-------|-------|--------|--------------|-------------|--------|
| services/refrigerator-repair | ✅ Neutral SoCal | ✅ MAIN_PHONE | ✅ Service | ✅ absent | ✅ clean | ✅ **DONE** |
| services/washer-repair | ✅ Neutral SoCal | ✅ MAIN_PHONE | ✅ Service | ✅ absent | ✅ clean | ✅ **DONE** |
| services/dryer-repair | ✅ Neutral SoCal | ✅ MAIN_PHONE | ✅ Service | ✅ absent | ✅ clean | ✅ **DONE** |
| services/stove-repair | ✅ Neutral SoCal | ✅ MAIN_PHONE | ✅ Service | ✅ absent | ✅ clean | ✅ **DONE** |
| services/wine-cooler-repair | ✅ Neutral SoCal | ✅ MAIN_PHONE | ✅ Service (with @id) | ✅ absent (doc-only) | ✅ clean | ✅ **DONE** |
| commercial/walk-in-cooler-repair | ✅ Neutral SoCal | ✅ MAIN_PHONE | ✅ Service | ✅ absent (doc-only) | ✅ clean | ✅ **DONE** |
| commercial/exhaust-hood-repair | ✅ Neutral SoCal | ✅ MAIN_PHONE | ✅ Service | ✅ absent (doc-only) | ✅ clean | ✅ **DONE** |

**Note on "aggR JSON-LD doc-only":** wine-cooler/walk-in-cooler/exhaust-hood `grep -c "aggregateRating"` returns 1, but match is in the Phase 3 frontmatter comment (`// aggregateRating REMOVED per wiki/decisions/...`), not in actual JSON-LD output. Verified — no aggregateRating block emitted.

**Tier 1 Summary: 7/7 ✅ DONE**

### Tier 2 Residential — expected TODO (8/8)

| Page | Title | Phone | Schema | aggR JSON-LD | Status |
|------|-------|-------|--------|--------------|--------|
| services/dishwasher-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/oven-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/freezer-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/range-hood-repair | LA-locked | (424) hardcoded | LocalBusiness (faqs[] pattern) | present | ❌ **TODO** |
| services/ice-maker-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/cooktop-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/dryer-vent-repair | LA-locked | (424) hardcoded | LocalBusiness (faqs[] pattern) | present | ❌ **TODO** |
| services/microwave-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |

### Tier 3 Residential — expected TODO (10/10)

| Page | Title | Phone | Schema | aggR JSON-LD | Status |
|------|-------|-------|--------|--------------|--------|
| services/wall-oven-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/induction-cooktop-repair | LA-locked | (323) hardcoded | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/built-in-refrigerator-repair | LA-locked | (424) hardcoded | LocalBusiness (faqs[] pattern) | present | ❌ **TODO** |
| services/stackable-washer-dryer-repair | LA-locked | (424) hardcoded | LocalBusiness | present | ❌ **TODO** |
| services/laundry-repair | LA-locked | (424) hardcoded | LocalBusiness (faqs[] pattern) | present | ❌ **TODO** |
| services/trash-compactor-repair | LA-locked | (424) hardcoded | LocalBusiness (faqs[] pattern) | present | ❌ **TODO** |
| services/garbage-disposal-repair | LA-locked | (no const phone) | HomeAndConstructionBusiness | present | ❌ **TODO** |
| services/fireplace-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** (partial — no aggR) |
| services/bbq-grill-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** (partial — no aggR) |
| services/pizza-oven-repair | LA-locked | (no const phone) | Service | present | ❌ **TODO** (partial — Service type already, but LA-locked + has aggR) |

### Tier 2 Commercial — expected TODO (6/6)

| Page | Title | Phone | Schema | aggR JSON-LD | Status |
|------|-------|-------|--------|--------------|--------|
| commercial/refrigerator-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/dishwasher-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/ice-machine-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/walk-in-freezer-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/oven-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/freezer-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |

### Tier 3 Commercial — expected TODO (5/5)

| Page | Title | Phone | Schema | aggR JSON-LD | Status |
|------|-------|-------|--------|--------------|--------|
| commercial/stove-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/dryer-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/laundry-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/washer-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |
| commercial/fryer-repair | LA-locked | (323) hardcoded | LocalBusiness | absent | ❌ **TODO** |

### Services Summary

- **Tier 1: 7/7 ✅ done**
- **Tier 2/3 residential: 0/18 done** (all 18 LA-locked, hardcoded phone, old schema)
- **Tier 2/3 commercial: 0/11 done** (all 11 LA-locked, hardcoded phone, old schema)
- **Total Tier 2/3: 0/29 done**
- **Visible body rating (★ 4.6 · 37 reviews) rendered in DOM:** only `services/garbage-disposal-repair.astro` actually renders rating in DOM via `class="hero-rating"` (the rest have orphan `.hero-rating` CSS but don't use it). One additional hit on `commercial/index.astro` (hub, out of scope).

### Notable observations

- 8 of 11 commercial Tier 2/3 pages (refrigerator, dishwasher, ice-machine, walk-in-freezer, oven, freezer + Tier 3 5) **already lack aggregateRating** in JSON-LD — easier to migrate, only need title/schema/county changes.
- 2 of 10 Tier 3 residential (fireplace, bbq-grill) also already lack aggregateRating.
- pizza-oven already uses `@type: Service` — partial migration done; needs LA-lock removal + 5-county areaServed + aggR removal.

## City pages

- **Total .astro at src/pages root:** 109
- **Migrated to Variant A (`import CityLayout`):** 82
- **Not migrated (still on old `Layout`):** 27 — but most are non-city pages (county hubs, boutique verticals, legal, contact, index)
- **Actual city pages NOT migrated:** 5
  - `calabasas.astro`
  - `el-segundo.astro`
  - `monrovia.astro`
  - `north-hollywood.astro`
  - `studio-city.astro`

**T9 batch 9 commit message claims "87/87 cities COMPLETE" — but 5 cities still on old Layout. Possible reason: `.astro.old` backups exist for 4 of the 5 (calabasas, el-segundo, monrovia, north-hollywood, studio-city all have .old) but the new versions weren't written, OR the migration was rolled back.**

### Non-city not-migrated (expected — kept on old Layout intentionally or out of scope)

- County hubs: los-angeles-county, orange-county, ventura-county, san-bernardino-county, riverside-county
- Boutique verticals: 4 wine-cellar-repair-{bel-air,beverly-hills,malibu,newport-beach,pacific-palisades}, 3 outdoor-kitchen-repair-{malibu,newport-beach,thousand-oaks}, bbq-grill-repair-beverly-hills, wine-cellar-maintenance, outdoor-kitchen-maintenance
- Site chrome: index, contact, book, ai-diagnostic, terms, privacy-policy

## Infrastructure

- **BranchesBlock.astro:** ✅ exists
- **ServiceHero.astro:** ✅ updated (4× MAIN_PHONE refs, 3× showBranches refs, 3× San Bernardino/Riverside refs in eyebrow defaults)
- **CommercialHero.astro:** ✅ updated (4× MAIN_PHONE refs, 4× showBranches refs)
- **CityLayout.astro:** ✅ exists at src/layouts/
- **src/components/cities/{branded,custom,shared}/:** ✅ exists (3 subdirs)
- **branches.ts:** ✅ exists with 8 branches:
  - West Hollywood, Beverly Hills, Los Angeles, Pasadena, Thousand Oaks, Irvine, Rancho Cucamonga, Temecula
  - `MAIN_PHONE = '(424) 325-0520'` exported

## Documentation

- **wiki/decisions/nap-rating-policy-ssot.md:** ✅ exists at `C:/Users/Roman/projects/sdar-v2-wiki/sdar-v2-wiki/wiki/decisions/nap-rating-policy-ssot.md` (6034 bytes, 2026-04-27)
- **audit-output/ on refactor branch:** ❌ does NOT exist on the branch (created fresh for this audit). The `rewrite-plans/` referenced in earlier session memory was untracked working-tree state, not committed to refactor branch.
- **rewrite-plans available on this branch:** 0/29 (none — they were never committed)

**Implication:** if Tier 2/3 work resumes, the rewrite plans need to be regenerated or fetched from another location. They are NOT in git history.

## Build status

- **Build on `refactor/services-multi-county-hubs`:** ✅ **GREEN**
- **Pages built:** 588
- **Build time:** 29.66s
- **Errors:** none
- **Sitemap:** generated successfully

## Recommendation

### Ready to merge into main? **Conditionally yes — but with caveats**

The branch is build-clean, the 7 Tier 1 services pages are correctly rewritten, the city migration is 82/87 done, and all infrastructure (components, branches.ts, CityLayout) is in place. The 29 Tier 2/3 services are still on legacy LA-locked content but are functional and will continue to render (they're SEO suboptimal, not broken).

### What needs decision before merge

1. **Merge conflict on 81 city pages.** The previous merge attempt failed because main got T8-T13 commits (`caddd50` Merge `refactor/v2-design-system`, plus T10/T11/T12/T13) that overlap heavily with refactor branch's T8/T9 commits on the same city files. The git log on main already contains:
   - `caddd50` Merge `refactor/v2-design-system`: v2 design system complete
   - `78dccf1` T13-FIX
   - `097e66f` T13
   - T12 batches 1-5
   - T11 anaheim + T11-FIX
   - T10 west-hollywood + T10 v2 components

   The refactor branch has T8 + T9 series that may be **stale duplicates or divergent versions** of the same city work that's now on main. **Recommendation:** before retrying merge, do `git log main --oneline | grep -E "T8|T9|T10|T11|T12|T13"` to see what's already on main, and `git log refactor --oneline | grep -E "T8|T9"` to see what refactor adds. If main already contains equivalent work, the refactor T8/T9 commits should be dropped (rebase/cherry-pick only the Phase 3 services commits).

2. **5 unmigrated cities** (calabasas, el-segundo, monrovia, north-hollywood, studio-city). Decision: migrate before merge, or merge as-is and migrate later.

3. **29 Tier 2/3 services remain TODO.** Decision: continue this branch and finish all 29 before merge, OR merge Tier 1 now and do Tier 2/3 on a follow-up branch (cleaner, smaller blast radius).

### Recommended merge approach

Given the conflicts and the fact that **main already has equivalent T10-T13 city migration work** (different commits, same files), the cleanest path is:

1. **Do NOT do a straight merge of refactor → main.** It will conflict on every city page that exists on both branches.
2. **Cherry-pick only the Phase 3 services commits** to main:
   - `e897a87` (components)
   - `9fd4f51` (refrigerator)
   - `f19c3a7` (NAP SSOT prerequisite)
   - `0a49ba8` (washer/dryer/stove)
   - `fda737c` (wine-cooler + walk-in-cooler + exhaust-hood)
   - `668e70b` (aggR cleanup)

   These touch only `src/components/{Service,Commercial}Hero.astro`, `src/components/BranchesBlock.astro`, `src/data/branches.ts` (possibly), and the 7 Tier 1 service `.astro` files. Should cherry-pick cleanly with minimal conflicts.
3. **Keep `refactor/services-multi-county-hubs` branch alive** for Tier 2/3 work, rebased onto fresh main once Phase 3 services land.
4. **Do NOT merge T8/T9 city commits** — main already has T10-T13 equivalents.

### Outstanding work after merge

- 29 Tier 2/3 services rewrites (Phase 3 continuation)
- 5 unmigrated city pages (or accept as backlog)
- Regenerate or recover `audit-output/rewrite-plans/` (29 plans not in git)
- Verify city pages on `main` match the spec from refactor's T9 (since main has T10-T13 versions, content should be at parity or better)
