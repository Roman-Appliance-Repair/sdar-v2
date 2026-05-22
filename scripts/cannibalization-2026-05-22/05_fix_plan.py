"""STEP 9 — Recommended fix plan.

Per CRITICAL/HIGH case, pick option A/B/C/D:
  A — canonical: add <link rel="canonical" href={intended}> on winner page
  B — anchor:    rewrite internal anchors to drive equity toward intended
  C — content:   extend intended page with query terms / cluster
  D — merge:     301 winner→intended (or vice versa) — collapse pages
Plus est. impact in monthly impressions.

Output: scripts/cannibalization-2026-05-22/fix-plan.csv
"""
from __future__ import annotations

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
ART = ROOT / "scripts/cannibalization-2026-05-22"

CANN_CSV = ART / "cannibal-map.csv"
LINKS_CSV = ART / "all-internal-links.csv"
DEEP_CSV = ART / "top20-deep-dive.csv"
OUT_CSV = ART / "fix-plan.csv"

# Monthly imp projection multiplier — 30 days / 14 days × reclaim_rate.
# Use conservative 60% reclaim.
PROJ = (30 / 14) * 0.6


def src_path(url: str) -> str:
    """Map URL → src/pages/... (best-effort, mirrors deep_dive find_astro_source)."""
    if url == "/":
        return "src/pages/index.astro"
    parts = [p for p in url.strip("/").split("/") if p]
    if not parts:
        return "src/pages/index.astro"
    # parametric city × service?
    if len(parts) == 2 and re.match(r"^[a-z0-9-]+$", parts[0]) and parts[1].endswith("-repair") is False:
        cand1 = ROOT / "src/pages" / parts[0] / f"{parts[1]}.astro"
        if cand1.exists():
            return str(cand1.relative_to(ROOT)).replace("\\", "/")
        return "src/pages/[city]/[service].astro"
    if len(parts) == 1:
        return f"src/pages/{parts[0]}.astro"
    return "src/pages/" + "/".join(parts[:-1]) + f"/{parts[-1]}.astro"


def pick_option(case: dict, intended_imp: int, winner_imp: int) -> str:
    """Pick A/B/C/D based on case shape.

    Heuristics:
      D (merge)    — both pages target nearly same intent AND winner ranking weak
                     (single misalignment, pos>20). Or if intended URL points to
                     /(homepage) but query is brand/city-specific — D=create a
                     proper landing instead.
      A (canonical)— hub page winning a query meant for sub-page; sub-page exists.
      B (anchor)   — many URLs ranking; intended exists but starved of in-links.
      C (content)  — intended page exists but thin (<800 words) AND tok_hits low.
    """
    num_urls = int(case["num_urls"])
    is_mis = case["is_misaligned"] == "True"
    avg_pos = float(case["avg_position"])
    intended = case["intended_url"]
    actual = case["actual_winner"]

    # Default branch
    if not is_mis and num_urls > 1:
        return "B"  # aligned but split — anchor consolidation
    # Misalignment cases.
    if intended == "/":
        return "C"  # we don't really want home to be intended → recommend new/expanded page
    # Hub winner pattern → canonical from hub to specific
    if actual in {"/west-hollywood/", "/los-angeles/", "/pasadena/", "/thousand-oaks/"}:
        return "A"
    # Many competing URLs → anchor consolidation
    if num_urls >= 5:
        return "B"
    # Few URLs and intended page weak position → merge
    if num_urls <= 2 and avg_pos > 25:
        return "D"
    return "A"


def files_to_change(option: str, intended: str, actual: str) -> str:
    intended_src = src_path(intended)
    actual_src = src_path(actual)
    if option == "A":
        return f"{actual_src} (add canonical→{intended})"
    if option == "B":
        # Anchor sweep is site-wide internal-links rewrite.
        return f"{intended_src} (internal links sweep across src/**.astro pointing to {intended})"
    if option == "C":
        return f"{intended_src} (content expansion + add query cluster)"
    if option == "D":
        return f"public/_redirects + astro.config.mjs (301 {actual} → {intended}); delete {actual_src}"
    return "?"


def main() -> int:
    cases = list(csv.DictReader(CANN_CSV.open(encoding="utf-8")))
    # Pick CRITICAL + HIGH for the fix plan, top by impressions.
    actionable = [c for c in cases if c["severity"] in ("CRITICAL", "HIGH")]
    actionable.sort(key=lambda c: -int(c["total_impressions"]))

    rows = []
    for c in actionable:
        opt = pick_option(c, int(c["intended_imp"]), int(c["winner_imp"]))
        files = files_to_change(opt, c["intended_url"], c["actual_winner"])
        imp_14 = int(c["total_impressions"])
        # Reclaimable = full-imp for hard misaligns; halved for "diluted across N URLs".
        if c["is_misaligned"] == "True":
            reclaim_14 = imp_14
        else:
            reclaim_14 = imp_14 // 2
        est_month = round(reclaim_14 * PROJ)
        rows.append({
            "severity": c["severity"],
            "query": c["query"],
            "intended": c["intended_url"],
            "winner": c["actual_winner"],
            "option": opt,
            "files_to_change": files,
            "imp_14d": imp_14,
            "est_monthly_reclaim_imp": est_month,
            "num_urls": c["num_urls"],
            "avg_position": c["avg_position"],
        })

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        for r in rows:
            w.writerow(r)

    by_opt: dict[str, int] = defaultdict(int)
    by_opt_imp: dict[str, int] = defaultdict(int)
    for r in rows:
        by_opt[r["option"]] += 1
        by_opt_imp[r["option"]] += r["est_monthly_reclaim_imp"]
    print(f"wrote {OUT_CSV} ({len(rows)} actionable cases)", file=sys.stderr)
    print("option summary (reclaimable monthly imps proj):", file=sys.stderr)
    for o in ("A", "B", "C", "D"):
        print(f"  {o}  {by_opt[o]:4d} cases  ~{by_opt_imp[o]:5d} imps/mo", file=sys.stderr)
    print(f"  total ~{sum(by_opt_imp.values())} imps/mo reclaimable", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
