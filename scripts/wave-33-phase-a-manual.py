"""Wave 33 Phase A manual fixes — 23 outliers (5 still long + 18 over-shortened)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module
sweep = import_module("wave-33-stage4-sweep")
replace_in_file = sweep.replace_in_file

REWRITES = {
    # === 5 still > 160 ===
    "src/pages/outdoor/wine-cellar-repair-bel-air.astro":
        "Bel Air wine cellar repair. WhisperKOOL Extreme, CellarPro VSx, Wine Guardian, Fondis. 1,000-5,000+ bottle estate cellars. EPA 608, BHGS #A49573. $120 dx.",
    "src/pages/outdoor/wine-cellar-repair-beverly-hills.astro":
        "Beverly Hills wine cellar repair. WhisperKOOL, CellarPro, Wine Guardian, Breezaire, Vinotemp. 1K-10K bottle collections. EPA 608, BHGS #A49573. $120 dx.",
    "src/pages/services/outdoor-refrigerator-repair.astro":
        "Outdoor refrigerator repair across LA, OC, Ventura, SB, Riverside. Coastal salt-air, GFCI, drain/condensate, control boards. EPA 608. $89 dx waived.",
    "src/pages/services/wine-cellar-cooling-repair.astro":
        "Wine cellar cooling repair across LA, OC, Ventura, SB, Riverside. Evaporator fan, control board, humidity sensor, vapor barrier. EPA 608. $89 dx.",
    "src/pages/outdoor/smoker-repair/brands/big-green-egg.astro":
        "Big Green Egg repair across SoCal. Gasket replacement, dome thermometer, ceramic warranty, hardware. Lifetime ceramic warranty navigation. $120 dx.",

    # === 18 over-shortened (build back to 130-155) ===
    "src/pages/sherman-oaks.astro":
        "Same-day appliance repair Sherman Oaks CA. 91403, 91423, 91401, 91411. Refrigerator, washer, dryer, oven. BHGS #A49573. $89 dx waived.",
    "src/pages/outdoor/pizza-oven-repair.astro":
        "Residential outdoor pizza oven repair across SoCal. Gas burner, stone deck, insulation, ignition. Ooni, Forno, Alfa, Gozney. BHGS #A49573. $120 dx.",
    "src/pages/outdoor/wine-cellar-repair-malibu.astro":
        "Malibu wine cellar repair. Carbon Beach, Malibu Colony, Point Dume, Broad Beach. Coastal salt + humidity. EPA 608, BHGS #A49573. $120 dx waived.",
    "src/pages/services/built-in-refrigerator-repair.astro":
        "Built-in refrigerator repair across LA, OC, Ventura, SB, Riverside. Sub-Zero, Wolf, Thermador, Miele, Viking. Sealed system. EPA 608, BHGS #A49573. $89 dx.",
    "src/pages/services/ice-maker-repair.astro":
        "Same-day ice maker repair across LA, OC, Ventura, SB, Riverside. Sub-Zero, GE Profile, Scotsman, Frigidaire. Hard water, EPA 608. BHGS #A49573. $89 dx.",
    "src/pages/services/cooktop-repair/electric-element-failure.astro":
        "Electric cooktop element failure across LA, OC, Ventura. KitchenAid, GE, Whirlpool, Frigidaire. Coil + radiant. BHGS #A49573. $89 dx waived with repair.",
    "src/pages/services/cooktop-repair/induction-not-working.astro":
        "Induction cooktop not working across LA, OC, Ventura. Bosch, Miele, Wolf, Thermador, GE. Coil + control board. BHGS #A49573. $89 dx waived with repair.",
    "src/pages/services/dryer-vent-repair/code-compliance.astro":
        "Dryer vent code compliance across LA + OC. HOA + multi-unit common vent coordination. UMC compliance. BHGS #A49573. $89 residential dx waived with repair.",
    "src/pages/services/dryer-vent-repair/fire-safety.astro":
        "Dryer fires kill 13 Americans per year per NFPA. Lint accumulation is the leading cause. LA dryer vent service. BHGS #A49573. $89 residential dx waived.",
    "src/pages/services/garbage-disposal-repair/leaking.astro":
        "Garbage disposal leaking from top, bottom, or side? LA same-day. InSinkErator, Waste King, Moen. Seal + housing diagnosis. BHGS #A49573. $89 dx waived.",
    "src/pages/services/microwave-repair/sparking-arcing.astro":
        "Microwave sparking or arcing across LA, OC, Ventura. STOP USE IMMEDIATELY — fire risk. Magnetron, waveguide cover diagnosis. BHGS #A49573. $89 dx waived.",
    "src/pages/services/oven-repair/not-heating.astro":
        "Oven not heating across LA, OC, Ventura. Wolf, Viking, Thermador, GE, Samsung. Igniter, element, control board. BHGS #A49573. $89 dx waived with repair.",
    "src/pages/services/range-hood-repair/fan-noise.astro":
        "Range hood loud, rattling, grinding, or vibrating? LA same-day. Wolf, Zephyr, Broan, Vent-A-Hood. Motor, blower diagnosis. BHGS #A49573. $89 dx waived.",
    "src/pages/services/trash-compactor-repair/not-compacting.astro":
        "Compactor runs but won't compact? LA same-day. KitchenAid, Whirlpool, GE, Broan. Ram, drive belt, motor diagnosis. BHGS #A49573. $89 dx waived with repair.",
    "src/pages/services/trash-compactor-repair/wont-start.astro":
        "Compactor dead at the start? LA same-day. KitchenAid, Whirlpool, GE, Broan. Door switch, drive belt, control. BHGS #A49573. $89 dx waived with repair.",
    "src/pages/services/washer-repair/error-codes.astro":
        "Washer flashing error code? LA same-day. LG, Samsung, Whirlpool, Bosch, Miele. F-codes, OE/LE/UE, drain pump diagnosis. BHGS #A49573. $89 dx waived.",
    "src/pages/outdoor/grill-repair/regulator-issues.astro":
        "Propane regulator stuck in bypass mode is the most-misdiagnosed grill issue. LA same-day. Lynx, Wolf Outdoor, Fire Magic. BHGS #A49573. $120 dx.",
    "src/pages/outdoor/smoker-repair/brands/kamado-joe.astro":
        "Kamado Joe repair across SoCal. Ceramic + electric service trees. Gasket, dome thermometer, hardware. Premium ceramic kamado. BHGS #A49573. $120 dx.",
}


def main():
    import json, re
    violations = json.loads(Path("scripts/wave-33-violations.json").read_text(encoding="utf-8"))
    by_file = {v["file"]: v for v in violations}

    succeeded, failed, oor = [], [], []
    for fp, new_desc in REWRITES.items():
        n = len(new_desc)
        if n < 130 or n > 155:
            oor.append((fp, n, new_desc))
            continue
        v = by_file.get(fp)
        if not v:
            # File state may have changed (algorithm-modified), grab current desc directly
            text = Path(fp).read_text(encoding="utf-8")
            m = (re.search(r'const\s+description\s*=\s*"((?:[^"\\]|\\.)*?)"', text, re.S)
                 or re.search(r"const\s+description\s*=\s*'((?:[^'\\]|\\.)*?)'", text, re.S)
                 or re.search(r"const\s+description\s*=\s*`((?:[^`\\]|\\.)*?)`", text, re.S))
            if not m:
                failed.append((fp, "no-desc"))
                continue
            raw = m.group(1)
            old_desc = (raw.replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"').replace("\\'", "'").replace("\\\\", "\\"))
        else:
            old_desc = v["description"]
        ok = replace_in_file(Path(fp), old_desc, new_desc, '"')
        if ok:
            succeeded.append((fp, len(old_desc), n))
        else:
            failed.append((fp, "replace-failed"))

    print(f"Succeeded: {len(succeeded)}")
    for fp, old, new in succeeded:
        print(f"  [{old} -> {new}] {fp}")
    if oor:
        print("\nOOR (skipped):")
        for fp, n, d in oor:
            print(f"  [{n}] {fp}: {d}")
    if failed:
        print("\nFailed:")
        for fp, reason in failed:
            print(f"  [{reason}] {fp}")


if __name__ == "__main__":
    main()
