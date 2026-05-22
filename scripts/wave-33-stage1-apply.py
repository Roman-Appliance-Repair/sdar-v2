"""Wave 33 Stage 1 — apply 15 manual rewrites to top-30 priority pages
where current description > 155 chars."""
from pathlib import Path
import re

REWRITES = [
    # (file, old_starts_with_search_pattern_quote_char, new_description)
    # Index 2 — services/bbq-grill-repair
    ("src/pages/services/bbq-grill-repair.astro", '"',
     "BBQ grill repair across LA, OC, Ventura, SB, Riverside. Lynx, Alfresco, Fire Magic, Wolf, Weber, gas + built-in. BHGS #A49573. $89 diagnostic."),
    ("src/pages/commercial/dishwasher-repair.astro", '"',
     "Commercial dishwasher repair LA + OC. Hobart, Jackson, Champion, CMA, Meiko. 140-180F sanitizing per health code. BHGS #A49573. $120 diagnostic."),
    ("src/pages/commercial/washer-repair.astro", '"',
     "Commercial washer repair LA + OC. Speed Queen, Dexter, Maytag Commercial, Continental Girbau. Laundromats, hotels, apartments. BHGS #A49573. $120 dx."),
    ("src/pages/commercial/refrigeration/index.astro", '"',
     "Commercial refrigeration repair across SoCal. Walk-in coolers + freezers, reach-ins, prep tables, display cases. EPA 608. $120 dx, 24/7 dispatch."),
    ("src/pages/services/range-hood-repair.astro", '"',
     "Range hood repair across LA, OC, Ventura, SB, Riverside. Wolf, Zephyr, Broan, Vent-A-Hood. Wall, under-cabinet, island. BHGS #A49573. $89 dx."),
    ("src/pages/services/wine-cooler-repair.astro", '"',
     "Wine cooler + cellar repair across SoCal. Sub-Zero, Viking, Miele, Liebherr, Thermador, U-Line. Thermoelectric + compressor. EPA 608. $89 dx."),
    ("src/pages/commercial/fryer-repair.astro", '"',
     "Commercial fryer repair LA + OC. Frymaster, Pitco, Henny Penny, Vulcan, Dean. Gas-certified, BHGS #A49573, EPA 608. $120 diagnostic."),
    ("src/pages/services/fireplace-repair.astro", '"',
     "Fireplace repair across SoCal. Gas, electric, wood-burning. Pilot light, thermocouple, blower. Heat & Glo, Heatilator, Majestic. BHGS #A49573. $89 dx."),
    ("src/pages/services/stove-repair.astro", '"',
     "Stove + range repair across LA, OC, Ventura, SB, Riverside. Gas, electric, induction, dual-fuel. Wolf, Thermador, Viking, GE, LG, Samsung. $89 dx."),
    ("src/pages/commercial/ice-machines/index.astro", '"',
     "Commercial ice machine repair across SoCal. Hoshizaki, Manitowoc, Scotsman, Ice-O-Matic. Cube, flake, nugget. EPA 608. $120 dx, 24/7 dispatch."),
    ("src/pages/services/microwave-repair.astro", '"',
     "Microwave repair across LA, OC, Ventura, SB, Riverside. Countertop, over-the-range, built-in. All brands. High-voltage work. BHGS #A49573. $89 dx."),
    ("src/pages/glendale.astro", "'",
     "Same-day appliance repair Glendale CA. Verdugo Woodlands, Adams Hill, Rossmoyne, Montrose. Refrigerator, washer, dryer, oven. $89 dx, 90-day warranty."),
    ("src/pages/hollywood.astro", "`",
     "Same-day appliance repair Hollywood CA. Beachwood Canyon, Fountain Ave, Los Feliz border. Sub-Zero, Viking, LG, Wolf. BHGS #A49573. $89 dx."),
    ("src/pages/thousand-oaks.astro", "`",
     "Thousand Oaks appliance repair. Dos Vientos, Lynn Ranch, Newbury Park, Westlake Village. Sub-Zero, Wolf, Thermador, Miele. BHGS #A49573. $89 dx."),
    ("src/pages/anaheim.astro", "'",
     "Anaheim appliance repair. Anaheim Hills, Platinum Triangle, Downtown. Refrigerator, washer, dryer, oven. $89 dx waived with repair. BHGS #A49573."),
]


def main():
    results = []
    for fp, qchar, new_desc in REWRITES:
        path = Path(fp)
        text = path.read_text(encoding="utf-8")
        # Find the existing const description = qchar...qchar binding (first one)
        # Use a non-greedy match accommodating escapes
        pattern = (
            r"(const\s+description\s*=\s*)"
            + re.escape(qchar)
            + r"((?:[^"
            + re.escape(qchar)
            + r"\\]|\\.)*?)"
            + re.escape(qchar)
        )
        m = re.search(pattern, text, re.S)
        if not m:
            results.append((fp, "NO_MATCH", 0, len(new_desc)))
            continue
        old_desc = m.group(2)
        # Build replacement using same quote
        replacement = m.group(1) + qchar + new_desc + qchar
        new_text = text[: m.start()] + replacement + text[m.end():]
        path.write_text(new_text, encoding="utf-8")
        results.append((fp, "OK", len(old_desc), len(new_desc)))

    for fp, status, old_n, new_n in results:
        print(f"  [{status:>7}] {old_n:>4} -> {new_n:>3}   {fp}")


if __name__ == "__main__":
    main()
