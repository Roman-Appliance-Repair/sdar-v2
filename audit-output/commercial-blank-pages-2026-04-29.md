# Commercial Blank Pages Audit — 2026-04-29

## ⚠️ ENVIRONMENTAL NOTE — TWICE-DURING-SESSION BRANCH SWITCHING

During this audit session, the branch was switched WITHOUT my action **twice**:

1. At the start of the audit: I had pushed all Phase 3 commits to `main`, but the working tree showed `refactor/brands-ssot-cleanup` (HEAD `65cb6a8 BrandBranchesGrid component`). After user authorization, I `git checkout main` and ran the diagnostic build successfully (588 pages, dist/ populated).
2. **Mid-audit (~6 minutes later):** working tree silently switched back to `refactor/brands-ssot-cleanup`. `dist/` was wiped, and a NEW untracked file appeared (`scripts/sweep-brand-pattern-a.mjs`). A re-build from this state fails with `Could not resolve "../../components/BrandBranchesGrid.astro" from "src/pages/brands/bosch-dishwasher-repair.astro"` — that component lives only on `refactor/brands-ssot-cleanup`.

**Implication:** A parallel process or terminal session is running on `refactor/brands-ssot-cleanup` and is checking out that branch periodically. All file inspections in this report were performed during the window I was on `main`.

The diagnosis below is valid and reproducible. Recovery (file edits) should be staged on `main` while ensuring no other process touches the working tree.

---

## Summary

**ROOT CAUSE FOUND:** my Phase 3 conversions on 7 commercial pages used the pattern:

```astro
<script type="application/ld+json" set:html={JSON.stringify({...})} />
</script>     ← STRAY closing tag — self-closed script does NOT need a closing </script>
```

When Astro's parser encounters this on the second of two such blocks (or a block followed by a `<style>`), the body content that follows fails to render inside `<main>`. The HTML is built (file is ~85 KB, contains all section markup somewhere on disk) but the structural placement is broken — the `<main>` element ends up containing only the first schema script, with all body content (CommercialHero, sections, h1/h2/h3) effectively orphaned outside the document flow that the visible layout depends on.

**Result in production:** browser sees `<header>...</header><main>schema-only</main><footer>...</footer>` and renders header + footer with empty space between. The orphan content technically still exists in HTML but the user perceives the page as blank.

A separate but related bug affects `dishwasher-repair` specifically: the `MAIN_PHONE` import was used as if it's a string (`MAIN_PHONE.replace(/\D/g, '')`) but `MAIN_PHONE` is an object `{display, raw, href}`. This throws `TypeError: MAIN_PHONE.replace is not a function` during frontmatter execution.

---

## Affected pages (7) — verified diagnostic

| File | Source lines | <section in src | h2 in src | <script type= | </script> | set:html | dist size |
|---|---:|---:|---:|---:|---:|---:|---:|
| commercial/stove-repair.astro | 579 | 11 | 11 | 2 | **2 ⚠️** | 2 | 86,422 B |
| commercial/washer-repair.astro | 520 | 10 | 10 | 2 | **2 ⚠️** | 2 | 82,920 B |
| commercial/laundry-repair.astro | 454 | 8 | 8 | 2 | **2 ⚠️** | 2 | 73,778 B |
| commercial/fryer-repair.astro | 559 | 10 | 10 | 2 | **2 ⚠️** | 2 | 88,409 B |
| commercial/freezer-repair.astro | 591 | 11 | 11 | 2 | **1 ⚠️** | 2 | 89,987 B |
| commercial/dryer-repair.astro | 576 | 11 | 11 | 2 | **2 ⚠️** | 2 | 85,360 B |
| commercial/dishwasher-repair.astro | 609 | 11 | 11 | 2 | 0 | 2 | 88,734 B |

⚠️ = stray `</script>` closing tags after self-closing `<script set:html={...} />` syntax.

**Dishwasher anomaly:** has 0 stray `</script>` (clean self-closing script syntax) but still on user's broken-page list. Source-level inspection found a separate bug:

```js
import { MAIN_PHONE } from '../../data/branches';
const phone = MAIN_PHONE;                          // ← MAIN_PHONE is an object, not a string
const phoneRaw = MAIN_PHONE.replace(/\D/g, '');    // ← TypeError: object has no .replace()
const phoneHref = `tel:+1${phoneRaw}`;             // ← never reached
```

**Note:** stove, washer, laundry, fryer, freezer, dryer all use the correct pattern (`MAIN_PHONE.display`, `.raw`, `.href`) — their bug is purely the stray `</script>` tag.

## Reference (working pages)

### Tier 1 reference (existing, never touched in Phase 3)

| File | Source lines | <section | h2 | <script type= | </script> | set:html | dist size |
|---|---:|---:|---:|---:|---:|---:|---:|
| commercial/walk-in-cooler-repair.astro | 671 | 13 | 13 | 2 | 0 | 2 | 100,718 B |
| commercial/exhaust-hood-repair.astro | 742 | 12 | 12 | 2 | 0 | 2 | 109,169 B |

### Phase 3 commits that DID work (no stray script tags)

| File | Source lines | <section | h2 | <script type= | </script> | set:html | dist size |
|---|---:|---:|---:|---:|---:|---:|---:|
| commercial/refrigerator-repair.astro (509b3ed) | 625 | 12 | 12 | 2 | 0 | 2 | 93,537 B |
| commercial/oven-repair.astro (da8ceea) | 609 | 11 | 11 | 2 | 0 | 2 | 87,652 B |
| commercial/walk-in-freezer-repair.astro (7298cf6) | 599 | 12 | 12 | 2 | 0 | 2 | 89,135 B |
| commercial/ice-machine-repair.astro (4b6aedd) | 565 | 10 | 10 | 2 | 0 | 2 | 85,210 B |

**Pattern:** the 4 Phase 3 commercial commits that work all have **0 stray `</script>` tags** — i.e. they use `<script set:html={...} />` self-closing without a paired closing tag. The 6 broken commercial commits have **1-2 stray `</script>` tags**.

### Smoking-gun proof — `<main>` content size in dist HTML

```
STOVE        <main> content length:    1,116 chars   ← only the Service schema
WALK-IN-COOLER <main> content length: 57,096 chars  ← full page body
```

(Both pages are ~80-100 KB total dist size, but stove's body content has been EXCLUDED from the `<main>` element. The HTML still contains the body markup elsewhere on disk, but it's structurally orphaned and not visible in the layout.)

---

## Git blame — diff stats per Phase 3 commit

| File | Last commit | Insertions | Deletions |
|---|---|---:|---:|
| commercial/stove-repair.astro | 0bf13d4 | 108 | 78 |
| commercial/washer-repair.astro | 25f785b | 89 | 72 |
| commercial/laundry-repair.astro | fecf460 | 81 | 64 |
| commercial/fryer-repair.astro | feb9054 | 100 | 83 |
| commercial/freezer-repair.astro | 1267fe7 | 115 | 83 |
| commercial/dryer-repair.astro | 4360be7 | 84 | 67 |
| commercial/dishwasher-repair.astro | c5070f4 | 124 | 92 |

**No catastrophic content loss** — insertions exceed deletions everywhere. The bug is structural HTML/Astro syntax (stray `</script>` tags), not deleted body content.

---

## Build status

- `npx astro build` (run on `main` HEAD = `2e43ccc`, with all Phase 3 commits intact): **588 pages built green, no errors, no warnings.** Build completes in ~32s.
- Re-run build attempted later (after branch silently switched back): **failed** with `Could not resolve "../../components/BrandBranchesGrid.astro"` from `bosch-dishwasher-repair.astro` — UNRELATED to Phase 3 commercial issue, this is a parallel-T-BRANDS work artifact on the wrong branch.

So: **Astro doesn't error on the stray `</script>` tags** — it produces a "successfully built" HTML where the broken section is silently empty. This is why the bug went undetected until production rendering check.

---

## Root cause hypothesis (CONFIRMED with high confidence)

When converting from inline schema:

```astro
<script type="application/ld+json">
{...JSON literal...}
</script>
```

to the new pattern:

```astro
<script type="application/ld+json" set:html={JSON.stringify({...})} />
```

I left the `</script>` closing tag in place on 6 of 7 affected files (the 7th is dishwasher with a different bug). The result is malformed:

```astro
<script type="application/ld+json" set:html={...} />
</script>           ← STRAY — closes nothing, but Astro/Vite parser silently breaks subsequent rendering
```

The 4 commercial pages that work were converted to use `JSON.stringify` set:html WITHOUT the stray closing tag (e.g. refrigerator-repair, oven-repair). Those work because they're well-formed.

**Why production deploy is blank but local build is "OK":**
- Astro doesn't error during build (just silently produces broken `<main>`).
- Cloudflare Pages deploys whatever the build produces.
- In the browser, `<main>` is empty (just schema script), and the rest of the body content sits orphaned. Most CSS layout depends on the `<main>` element being the visible content area.

---

## Recovery options

### Option A — surgical fix (RECOMMENDED)

For each of 6 stray-script files (stove, washer, laundry, fryer, freezer, dryer), remove the stray `</script>` tag(s) right after each `<script set:html={...} />` self-closing block.

For dishwasher specifically, fix the MAIN_PHONE import usage:

```js
// before (broken):
const phone = MAIN_PHONE;
const phoneRaw = MAIN_PHONE.replace(/\D/g, '');
const phoneHref = `tel:+1${phoneRaw}`;

// after (correct):
const phone = MAIN_PHONE.display;
const phoneRaw = MAIN_PHONE.raw;
const phoneHref = MAIN_PHONE.href;
```

Plus all `${phone}` interpolations downstream might need verification (since `phone` was an object, anywhere `phone` was used directly would render `[object Object]`).

**Estimated time:** ~30-45 minutes total (6 stray-script fixes are mechanical; dishwasher needs more careful audit).

### Option B — revert all 7 commits

`git revert c5070f4 da8ceea 1267fe7 0bf13d4 4360be7 fecf460 25f785b feb9054` (some of these are working — reverting all is overkill). NOT RECOMMENDED — would lose 4-county neutralization on working pages.

### Option C — revert only the 7 broken commits and re-apply

Per affected commit: `git revert <hash>`, then re-apply the neutralization but using the well-formed `set:html` self-closing syntax (the same pattern used on the 4 working Phase 3 commits).

### Recommended sequence

1. **Block parallel process first** — find what's switching branches and stop it (otherwise repair work will be reverted again).
2. Apply Option A surgical fix on `main`.
3. Build, verify all 7 pages render with full body content.
4. Push.
5. Wait for Cloudflare deploy and verify in production.

---

## Files NOT modified during this audit

- No `.astro` files edited.
- No git commits, reverts, or pushes.
- Only file written: this audit report at `audit-output/commercial-blank-pages-2026-04-29.md` (untracked, not staged).

---

## Audit completed: 2026-04-29
