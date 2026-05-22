"""Wave 33 Phase B — manual rewrites for 19 high-uniqueness pages
(15 blog + 2 for-business + 1 parametric + 1 other)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module
sweep = import_module("wave-33-stage4-sweep")
replace_in_file = sweep.replace_in_file

# Blog files use `const meta = { description: "..." }` pattern; need a separate replace path.
import re

REWRITES_CONST = {
    # === for-business ===
    "src/pages/for-business/hotels.astro":
        "Appliance repair for LA hotels + hospitality. Guest room appliances, commercial laundry, kitchen equipment, mini-bars. COI available. $120 dx.",
    "src/pages/for-business/restaurants.astro":
        "Commercial kitchen appliance repair for LA restaurants + cafes. Walk-in coolers, ranges, fryers, ice machines. $120 dx, same-day. COI on file.",
    # === other ===
    "src/pages/areas/index.astro":
        "Same-day appliance repair across LA, OC, Ventura, SB, Riverside. 65+ cities served from 8 branch locations. BHGS #A49573, EPA 608. $89 / $120 dx.",
}


# Parametric template — replace the entire literal so it produces ~130-155 chars when expanded.
PARAMETRIC_FILE = "src/pages/[city]/[service].astro"
PARAMETRIC_NEW_LITERAL = (
    "`Same-day ${serviceName} in ${cityName}. ${brandPool.slice(0, 4).join(', ')}. "
    "BHGS #A49573, $89 dx waived with repair.`"
)


# Blog files use object-property syntax inside `const meta = {}`.
REWRITES_META = {
    "src/pages/blog/bosch-dishwasher-worth-repairing.astro":
        "Bosch dishwasher repair-vs-replace decision. 800/300/100 series tier breakdown, LADWP hard water tolerance, 12-15 year service window math.",
    "src/pages/blog/built-in-vs-free-standing-refrigerator-repair-costs.astro":
        "Built-in (Sub-Zero, Wolf integrated) vs free-standing refrigerator economics. Service access, cabinetry constraints, year 12-15 replacement math.",
    "src/pages/blog/commercial-ice-machine-sanitization-health-dept.astro":
        "LA County DPH ice machine inspection criteria, 6-month vs annual descaling cadence, Hoshizaki/Manitowoc/Scotsman differences, LADWP scaling angle.",
    "src/pages/blog/commercial-walk-in-cooler-compressor-failure-restaurant-guide.astro":
        "Year 8-12 walk-in cooler compressor failure pattern, condenser-clean vs sealed-system diagnosis, Health Dept coordination, EPA 608. $120 dx.",
    "src/pages/blog/gas-range-wont-light-pilot-igniter-valve.astro":
        "Gas range won't light: standing pilot vs electronic ignition, thermocouple, spark module, gas valve. Safety + leak detection. Brand patterns.",
    "src/pages/blog/la-hard-water-killing-dishwasher.astro":
        "LADWP 5-9 grains, Calleguas 8-14. Scale buildup on heating elements + spray arms, annual descale routine, brand tolerance (Bosch/Miele/Whirlpool).",
    "src/pages/blog/premium-vs-mid-tier-refrigerator-15-year-tco.astro":
        "Sub-Zero $8K + $2K repair = $10K TCO. KitchenAid $3K + $1.5K + year-12 replace = $7.5K. Math-based premium-vs-mid-tier decision framework.",
    "src/pages/blog/range-hood-vent-obstruction-diy-fix-limits.astro":
        "LA cooking grease patterns, make-up air imbalance in newer construction, professional cleaning vs replacement. DIY limits + when to call a tech.",
    "src/pages/blog/repair-vs-replace-refrigerator-la-guide.astro":
        "Year-pattern decision tree, premium vs mid-tier service-life math, the 50% rule, what LADWP hard water does to your ice maker. SDAR field techs.",
    "src/pages/blog/seasonal-appliance-repair-patterns-la.astro":
        "Refrigerator failures spike summer (heat stress), oven calls spike Oct-Nov, washer + dryer year-round + spring spike. LA-specific seasonal patterns.",
    "src/pages/blog/sub-zero-refrigerator-not-cooling-5-checks.astro":
        "Sub-Zero dual-compressor diagnostic, condenser coil cleaning self-service, year-pattern compressor failures, LA dust + grease accumulation impact.",
    "src/pages/blog/top-5-outdoor-grill-brand-failures-la.astro":
        "Lynx, Wolf Outdoor, Twin Eagles, Fire Magic, Bull. Coastal salt corrosion (Beverly Hills, Santa Monica, Malibu), igniter failure year-patterns.",
    "src/pages/blog/why-refrigerator-is-loud-7-causes.astro":
        "Compressor, evaporator fan, condenser fan, ice maker, defrost timer, leveling, ice dispenser noise. Diagnostic order most to least common.",
    "src/pages/blog/wine-cooler-compressor-vs-thermoelectric-economics.astro":
        "Compressor-based premium (Sub-Zero, U-Line, Marvel) vs thermoelectric mid-tier wine coolers. LA climate stress, 5-12 year service window math.",
    "src/pages/blog/wolf-range-failures-honest-costs.astro":
        "Wolf range failure patterns: igniter, valve, infrared broiler. Wolf vs Sub-Zero (same parent) coordination. BH/WeHo/Pacific Palisades premium tier.",
}


def replace_meta_object(file_path: Path, new_desc: str) -> bool:
    """Replace description value inside `const meta = { description: "..." }`."""
    text = file_path.read_text(encoding="utf-8")
    pat = r'(const\s+meta\s*=\s*\{[^}]*?description:\s*)"((?:[^"\\]|\\.)*?)"'
    m = re.search(pat, text, re.S)
    if not m:
        return False
    new_escaped = new_desc.replace("\\", "\\\\").replace('"', '\\"')
    new_text = text[: m.start(2)] + new_escaped + text[m.end(2):]
    # The replacement leaves the surrounding quotes intact since we substituted the captured-content range.
    file_path.write_text(new_text, encoding="utf-8")
    return True


def replace_parametric(file_path: Path, new_literal: str) -> bool:
    """Replace the const description = `...` template literal in [city]/[service].astro."""
    text = file_path.read_text(encoding="utf-8")
    pat = r"(const\s+description\s*=\s*)`((?:[^`\\]|\\.)*?)`"
    m = re.search(pat, text, re.S)
    if not m:
        return False
    new_text = text[: m.start()] + m.group(1) + new_literal + text[m.end():]
    file_path.write_text(new_text, encoding="utf-8")
    return True


def main():
    import json
    violations = json.loads(Path("scripts/wave-33-violations.json").read_text(encoding="utf-8"))
    by_file = {v["file"]: v for v in violations}

    succeeded, failed, oor = [], [], []

    # Const-style files
    for fp, new_desc in REWRITES_CONST.items():
        n = len(new_desc)
        if n < 130 or n > 155:
            oor.append((fp, n, new_desc))
            continue
        v = by_file.get(fp)
        old_desc = v["description"] if v else None
        if not old_desc:
            failed.append((fp, "no-violation-record"))
            continue
        ok = replace_in_file(Path(fp), old_desc, new_desc, '"')
        if ok:
            succeeded.append((fp, len(old_desc), n))
        else:
            failed.append((fp, "replace-failed"))

    # Meta-object blog files
    for fp, new_desc in REWRITES_META.items():
        n = len(new_desc)
        if n < 130 or n > 155:
            oor.append((fp, n, new_desc))
            continue
        ok = replace_meta_object(Path(fp), new_desc)
        if ok:
            succeeded.append((fp, "?", n))
        else:
            failed.append((fp, "meta-replace-failed"))

    # Parametric template
    ok = replace_parametric(Path(PARAMETRIC_FILE), PARAMETRIC_NEW_LITERAL)
    if ok:
        succeeded.append((PARAMETRIC_FILE, "template", "template"))
    else:
        failed.append((PARAMETRIC_FILE, "parametric-replace-failed"))

    print(f"Succeeded: {len(succeeded)}")
    for r in succeeded:
        print(f"  {r}")
    if oor:
        print("\nOOR:")
        for fp, n, d in oor:
            print(f"  [{n}] {fp}: {d}")
    if failed:
        print("\nFailed:")
        for fp, reason in failed:
            print(f"  [{reason}] {fp}")


if __name__ == "__main__":
    main()
