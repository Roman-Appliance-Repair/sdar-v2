#!/usr/bin/env python3
# scripts/cslb-c38-cleanup-2026-05-29.py
# P0 CSLB C-38 -> C-20 HVAC compliance text-sweep (retired policy 2026-05-07).
# Replaces ONLY Type-A self-credential claims. Preserves Type-B "refer-out to a
# C-38 specialty contractor" references (factually correct) and "NO C-38" build
# comments. Exact-phrase map only — no rewrites, no bare-token regex.

import re, sys

# Ordered exact-phrase replacements (longest / most-specific first).
REPLACEMENTS = [
    ("CSLB C-38 Refrigeration Contractor scope", "CSLB C-20 HVAC"),
    ("CSLB C-38 Refrigeration scope", "CSLB C-20 HVAC"),
    ("CSLB C-38 Refrigeration", "CSLB C-20 HVAC"),
    ("EPA 608 + CSLB C-38", "EPA 608 + CSLB C-20 HVAC"),
    ("California C-38 Refrigeration Contractor licensed", "California C-20 HVAC licensed"),
    ("California C-38 Refrigeration Contractor license", "California C-20 HVAC license"),
    ("California C-38 refrigeration contractor licensing", "California C-20 HVAC licensing"),
    ("California C-38 refrigeration contractor license", "California C-20 HVAC license"),
    ("California C-38 licensed", "California C-20 HVAC licensed"),
    ("California C-38 license", "California C-20 HVAC license"),
    ("EPA 608 + C-38 licensed", "EPA 608 + C-20 HVAC licensed"),
    ("EPA 608 + C-38 certified", "EPA 608 + C-20 HVAC certified"),
    ("certified, C-38 licensed", "certified, C-20 HVAC licensed"),
    ("C-38 licensed for commercial refrigeration work", "C-20 HVAC licensed for commercial refrigeration work"),
    ("(BHGS, EPA 608, C-38)", "(BHGS, EPA 608, C-20 HVAC)"),
    ("EPA/C-38", "EPA/C-20 HVAC"),
    ("the scope C-38 covers", "the scope C-20 HVAC covers"),
]

# Phrases that must remain untouched (Type-B refer-outs + comments) — used only
# to validate that none were accidentally altered.
TYPE_B_GUARD = [
    "C-38 specialty refrigeration contractor",
    "C-38 contractor specialty trade",
    "C-38 specialists",
    "specialty C-38 contractor",
    "Specialty trade requiring C-38 license",
    "C-38 trade",
    "NO C-38",
    "NO CSLB C-38",
]

FILES = [
    "src/pages/blog/commercial-walk-in-cooler-compressor-failure-restaurant-guide.astro",
    "src/pages/commercial/refrigeration/brands/continental.astro",
    "src/pages/commercial/refrigeration/compressor-issues.astro",
    "src/pages/commercial/refrigeration/leaking-water.astro",
    "src/pages/commercial/refrigeration/not-cooling.astro",
    "src/pages/commercial/refrigeration/temperature-fluctuating.astro",
    "src/pages/commercial/refrigeration/walk-in-cooler-repair.astro",
    "src/pages/commercial/refrigeration/walk-in-freezer-repair.astro",
    "src/pages/commercial/refrigerator-repair.astro",
    "src/pages/price-list/walk-in-cooler-repair-cost.astro",
]

total_repl = 0
per_file = {}
for path in FILES:
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    before_guard = {g: text.count(g) for g in TYPE_B_GUARD}
    n = 0
    for old, new in REPLACEMENTS:
        c = text.count(old)
        if c:
            text = text.replace(old, new)
            n += c
    after_guard = {g: text.count(g) for g in TYPE_B_GUARD}
    # Assert Type-B / comment counts unchanged
    for g in TYPE_B_GUARD:
        assert before_guard[g] == after_guard[g], f"{path}: guard phrase altered: {g}"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)
    per_file[path] = n
    total_repl += n

print(f"TOTAL Type-A replacements: {total_repl}")
for p, n in per_file.items():
    print(f"  {n:2}  {p}")
