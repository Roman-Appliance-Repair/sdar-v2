# -*- coding: utf-8 -*-
"""
Wave: price-list title CTR fix (2026-06-05).

GSC 28d: /price-list/ section has ~10k impressions at positions 6-25 with
near-zero CTR (commercial-exhaust-hood: 3,307 imp @ pos 6.5, 0 clicks).
Titles were generic templates ("... Cost Los Angeles 2026 | Labor Rates")
with no numbers. Rewrite: real price range from each page's own price box
+ diagnostic-fee hook ($89 verified present on every residential page).

Exact-pair replacement, one per file. Fails loudly if a pair doesn't match.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src" / "pages" / "price-list"

# (file, old title, new title) — new titles all <= 60 chars
PAIRS = [
    ("dishwasher-repair-cost.astro",
     "Dishwasher Repair Cost Los Angeles 2026 | Labor Rates",
     "Dishwasher Repair Cost LA: $150–$320 ($89 Fee Waived)"),
    ("range-hood-repair-cost.astro",
     "Range Hood Repair Cost Los Angeles 2026 | Labor Rates",
     "Range Hood Repair Cost LA: $100–$320 ($89 Fee Waived)"),
    ("cooktop-repair-cost.astro",
     "Cooktop Repair Cost Los Angeles 2026 | Labor Rates",
     "Cooktop Repair Cost LA: $150–$400 ($89 Fee Waived)"),
    ("induction-cooktop-repair-cost.astro",
     "Induction Cooktop Repair Cost Los Angeles 2026 | Labor Rates",
     "Induction Cooktop Repair Cost LA: $180–$400 ($89 Waived)"),
    ("stove-repair-cost.astro",
     "Stove Repair Cost Los Angeles 2026 | Labor Rates",
     "Stove Repair Cost LA: $150–$380 ($89 Fee Waived)"),
    ("garbage-disposal-repair-cost.astro",
     "Garbage Disposal Repair Cost Los Angeles 2026 | Labor Rates",
     "Garbage Disposal Repair Cost LA: $89–$260 (2026 Prices)"),
    ("freezer-repair-cost.astro",
     "Freezer Repair Cost Los Angeles 2026 | Labor Rates",
     "Freezer Repair Cost LA: $200–$440 ($89 Fee Waived)"),
    ("range-repair-cost.astro",
     "Range Repair Cost Los Angeles 2026 | Labor Rates",
     "Range Repair Cost LA: $160–$400 ($89 Fee Waived)"),
    ("ice-maker-repair-cost.astro",
     "Ice Maker Repair Cost Los Angeles 2026 | Labor Rates",
     "Ice Maker Repair Cost LA: $120–$380 ($89 Fee Waived)"),
    ("dryer-vent-repair-cost.astro",
     "Dryer Vent Repair Cost Los Angeles — 2026 Pricing",
     "Dryer Vent Repair Cost LA: $140–$460 ($89 Fee Waived)"),
    ("refrigerator-repair-cost.astro",
     "Refrigerator Repair Cost Los Angeles 2026 | Labor Rates",
     "Refrigerator Repair Cost LA: $200–$440 ($89 Fee Waived)"),
    ("dryer-repair-cost.astro",
     "Dryer Repair Cost Los Angeles 2026 | Labor Rates",
     "Dryer Repair Cost LA: $150–$340 ($89 Fee Waived)"),
    ("fireplace-repair-cost.astro",
     "Gas Fireplace Repair Cost Los Angeles — Same Day 2026",
     "Gas Fireplace Repair Cost LA: $150–$380 ($89 Waived)"),
    ("oven-repair-cost.astro",
     "Oven Repair Cost Los Angeles 2026 | Labor Rates",
     "Oven Repair Cost LA: $175–$380 ($89 Fee Waived)"),
    ("wine-cooler-repair-cost.astro",
     "Wine Cooler & Fridge Repair Cost LA — Same Day 2026",
     "Wine Cooler Repair Cost LA: $150–$440 ($89 Fee Waived)"),
    ("wine-cellar-repair-cost.astro",
     "Wine Cellar Cooling Unit Repair Cost LA 2026 — Same Day",
     "Wine Cellar Repair Cost LA: $240–$560 ($89 Fee Waived)"),
    ("commercial-exhaust-hood-repair-cost.astro",
     "Commercial Vent Hood Repair Cost Los Angeles 2026",
     "Commercial Vent Hood Repair Cost LA: $200–$1,500 (2026)"),
    ("commercial-ice-machine-repair-cost.astro",
     "Commercial Ice Machine Repair Cost Los Angeles 2026",
     "Commercial Ice Machine Repair Cost LA: $240–$480 (2026)"),
    ("commercial-stove-repair-cost.astro",
     "Commercial Stove Repair Cost Los Angeles 2026",
     "Commercial Stove Repair Cost LA: $200–$420 (2026)"),
    ("commercial-freezer-repair-cost.astro",
     "Commercial Freezer Repair Cost Los Angeles 2026",
     "Commercial Freezer Repair Cost LA: $260–$520 (2026)"),
    ("commercial-dishwasher-repair-cost.astro",
     "Commercial Dishwasher Repair Cost Los Angeles 2026",
     "Commercial Dishwasher Repair Cost LA: $240–$520 (2026)"),
    ("commercial-laundry-repair-cost.astro",
     "Commercial Laundry Repair Cost Los Angeles 2026",
     "Commercial Laundry Repair Cost LA: $240–$480 (2026)"),
    ("commercial-fryer-repair-cost.astro",
     "Commercial Fryer Repair Cost Los Angeles 2026",
     "Commercial Fryer Repair Cost LA: $240–$480 (2026)"),
    ("commercial-oven-repair-cost.astro",
     "Commercial Oven Repair Cost Los Angeles 2026",
     "Commercial Oven Repair Cost LA: $260–$520 (2026)"),
    ("commercial-refrigerator-repair-cost.astro",
     "Commercial Refrigerator Repair Cost Los Angeles 2026",
     "Commercial Refrigerator Repair Cost LA: $240–$520 (2026)"),
    ("commercial-walk-in-freezer-repair-cost.astro",
     "Commercial Walk-in Freezer Repair Cost Los Angeles 2026",
     "Walk-In Freezer Repair Cost LA: $280–$580 (2026)"),
    ("commercial-slushie-machine-repair-cost.astro",
     "Commercial Slushie Machine Repair Cost LA — Same Day",
     "Commercial Slushie Machine Repair Cost LA: $200–$440"),
    ("commercial-bar-refrigerator-repair-cost.astro",
     "Commercial Bar Refrigerator Repair Cost Los Angeles 2026",
     "Commercial Bar Fridge Repair Cost LA: $200–$440 (2026)"),
    ("walk-in-cooler-repair-cost.astro",
     "Commercial Walk-In Cooler Repair Cost Los Angeles 2026",
     "Walk-In Cooler Repair Cost LA: $180–$1,600 (2026)"),
    ("pizza-oven-repair-cost.astro",
     "Pizza Oven Repair Cost LA — Residential + Commercial 2026",
     "Pizza Oven Repair Cost LA: $240–$520 (2026 Prices)"),
]

changed, errors = 0, 0
for fname, old, new in PAIRS:
    if len(new) > 60:
        print(f"SKIP {fname}: new title {len(new)} chars > 60")
        errors += 1
        continue
    p = ROOT / fname
    text = p.read_text(encoding="utf-8")
    needle = f'const title = "{old}";'
    replacement = f'const title = "{new}";'
    n = text.count(needle)
    if n == 0:
        if replacement in text:
            print(f"OK (already) {fname}")
        else:
            print(f"MISS {fname}: old title not found")
            errors += 1
        continue
    if n > 1:
        print(f"AMBIGUOUS {fname}: {n} matches")
        errors += 1
        continue
    p.write_text(text.replace(needle, replacement), encoding="utf-8")
    changed += 1
    print(f"CHANGED {fname} ({len(new)} chars)")

print(f"\nchanged={changed} errors={errors}")
sys.exit(1 if errors else 0)
