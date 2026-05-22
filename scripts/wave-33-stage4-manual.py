"""Wave 33 Stage 4 manual fixes — 56 pages where the auto-algorithm produced
either > 160 (need more aggression) or < 100 (over-shortened) results.

Each rewrite is hand-tuned to 130-155 chars preserving brand + scope + license + price.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module

# Reuse the regex-tolerant replace function from sweep
sweep = import_module("wave-33-stage4-sweep")
replace_in_file = sweep.replace_in_file


REWRITES = {
    # === 14 still-long brand + commercial (more aggression needed) ===
    "src/pages/brands/bertazzoni-dishwasher-repair.astro":
        "Bertazzoni dishwasher repair across SoCal. DW24 panel-ready + stainless-front. Italian Guastalla 1882 family heritage. BHGS #A49573. $89 dx.",
    "src/pages/brands/frigidaire-washer-repair.astro":
        "Frigidaire washer repair across SoCal. Affinity FAFW front-load, FFTW top-load, Gallery FFFW. E10/E20/E30/E70 codes. BHGS #A49573. $89 dx.",
    "src/pages/brands/frigidaire.astro":
        "Frigidaire appliance repair across LA, OC, Ventura, SB, Riverside. Gallery + Professional tiers. OEM parts. BHGS #A49573, EPA 608. $89 dx.",
    "src/pages/brands/ge-cafe-ice-maker-repair.astro":
        "GE Cafe ice maker repair across SoCal. CDE06 undercounter + CYE22 French-door integrated. Matte Black, Platinum Glass. BHGS #A49573. $89 dx.",
    "src/pages/brands/ge-washer-repair.astro":
        "GE washer repair across LA, OC, Ventura, SB, Riverside. Control board solder-joint diagnostics + personality programming. BHGS #A49573. $89 dx.",
    "src/pages/brands/ge.astro":
        "GE appliance repair across LA, OC, Ventura, SB, Riverside. GE Profile, Cafe, Monogram service. OEM parts. BHGS #A49573, EPA 608. $89 dx.",
    "src/pages/brands/jennair.astro":
        "JennAir appliance repair across SoCal. Refrigerators, ranges, wall ovens, cooktops, dishwashers. RISE + NOIR collections. BHGS #A49573. $89 dx waived.",
    "src/pages/brands/lg-freezer-repair.astro":
        "LG freezer repair across SoCal. Upright LRTLS, chest LROFC, garage-rated. Linear Compressor + 10-year warranty. BHGS #A49573. $89 dx waived.",
    "src/pages/brands/lg.astro":
        "LG appliance repair across LA, OC, Ventura, SB, Riverside. Refrigerator, washer + dryer (Direct Drive, OE/LE/UE), oven, dishwasher. BHGS #A49573, EPA 608.",
    "src/pages/brands/maytag-dryer-repair.astro":
        "Maytag dryer repair across SoCal. MED electric, MGD gas, Bravos, Maxima, Centennial. Whirlpool platform parts, F-codes. BHGS #A49573. $89 dx.",
    "src/pages/brands/samsung-dryer-repair.astro":
        "Samsung dryer repair across LA, OC, Ventura, SB, Riverside. Thermal fuse, heating element, tE/HE/DC error codes. BHGS #A49573, EPA 608. $89 dx.",
    "src/pages/brands/samsung.astro":
        "Samsung appliance repair across LA, OC, Ventura, SB, Riverside. RF refrigerators, WF/WA washers, DV dryers, NX/NE ranges, Bespoke. BHGS #A49573.",
    "src/pages/brands/whirlpool.astro":
        "Whirlpool appliance repair across LA, OC, Ventura, SB, Riverside. Refrigerator, washer (Cabrio + Duet), dryer, dishwasher, range. BHGS #A49573, EPA 608.",
    "src/pages/commercial/griddle-repair.astro":
        "Commercial griddle repair across SoCal. Vulcan VCRG, Garland Master Series ED, Star-Max, Wells electric, Keating Miraclean chrome. BHGS #A49573. $120 dx.",

    # === 42 over-shortened — manual rewrites ===
    "src/pages/brands/fisher-paykel-washer-repair.astro":
        "Fisher & Paykel washer repair across SoCal. WA/WH SmartDrive direct-drive, Series 9 front-load. Huntington Beach LA-local. BHGS #A49573. $89 dx waived.",
    "src/pages/brands/greenheck-hood-repair.astro":
        "Greenheck commercial kitchen hood + ventilation repair across SoCal. Independent Wisconsin family. C-20 HVAC scope. BHGS #A49573. $120 commercial dx.",
    "src/pages/brands/haier.astro":
        "Haier appliance repair across SoCal. 24\" compact built-ins for urban apartments + ADUs. GE Appliances parent (since 2016). BHGS #A49573. $89 dx.",
    "src/pages/brands/kitchenaid-range-hood-repair.astro":
        "KitchenAid range hood repair across SoCal. KVUB, KVWB, KXU professional series. Whirlpool family platform. BHGS #A49573. $89 dx waived with repair.",
    "src/pages/brands/vent-master-hood-repair.astro":
        "Vent Master commercial kitchen ventilation repair across SoCal. Independent. C-20 HVAC scope. BHGS #A49573. $120 commercial dx waived with repair.",
    "src/pages/brands/viking-bbq-grill-repair.astro":
        "Viking outdoor grill repair across SoCal. VGBQ T-Series + VGIQ I-Series gas, infrared sear. Premium Middleby brand. BHGS #A49573. $89 dx waived.",
    "src/pages/brands/viking.astro":
        "Viking appliance repair across SoCal. Range, refrigerator, dishwasher, oven, hood. Post-warranty specialists, Middleby family. BHGS #A49573. $89 dx waived.",
    "src/pages/commercial/charbroiler-repair.astro":
        "Commercial charbroiler repair across LA, OC, Ventura. Vulcan VCCB, Imperial IRB, Bakers Pride, MagiKitch'n. Radiant + lava rock. BHGS #A49573. $120 dx.",
    "src/pages/commercial/holding-cabinet-repair.astro":
        "Commercial holding cabinet repair across LA, OC, Ventura. Alto-Shaam, Cres Cor, Hatco, Metro. FDA 140F compliance. BHGS #A49573. $120 dx waived.",
    "src/pages/commercial/pizza-oven-repair.astro":
        "Commercial pizza oven repair across LA + OC. Lincoln conveyor, Marsal, Bakers Pride deck, Middleby Marshall, Wood Stone. BHGS #A49573. $120 dx waived.",
    "src/pages/commercial/range-repair.astro":
        "Commercial range repair across LA, OC, Ventura. Vulcan, Garland, Imperial, Wolf, Montague. Open burners, French tops, salamanders. BHGS #A49573. $120 dx.",
    "src/pages/commercial/steamer-repair.astro":
        "Commercial steamer repair across SoCal. Cleveland, Groen, Vulcan, AccuTemp. Pressureless + pressure steamers. BHGS #A49573, EPA 608. $120 dx.",
    "src/pages/credentials/insured.astro":
        "Same-day repair carries full general liability + workers compensation insurance. COI on request for property managers + commercial accounts. BHGS #A49573.",
    "src/pages/price-list/patio-heater-repair-cost.astro":
        "Patio heater repair cost Los Angeles. Thermocouple, ignition, regulator, electric element. $120-$340 typical. BHGS #A49573. $120 commercial dx.",
    "src/pages/price-list/wall-oven-repair-cost.astro":
        "Wall oven repair cost LA. Single + double wall ovens, all brands. Labor rates from $160. Wolf, Thermador, Viking, GE. BHGS #A49573. $89 residential dx.",
    "src/pages/commercial/charbroiler-repair/grease-trap-issues.astro":
        "Commercial charbroiler grease pan overflow or drain clog? LA same-day dispatch. Vulcan, Imperial, Bakers Pride. BHGS #A49573. $120 commercial dx.",
    "src/pages/commercial/fryer-repair/oil-leaking.astro":
        "Commercial fryer leaking hot oil? Fire + slip hazards. LA Health Dept + Fire Marshal coordination. Frymaster, Pitco, Henny Penny. BHGS #A49573. $120 dx.",
    "src/pages/commercial/griddle-repair/surface-warping.astro":
        "Commercial griddle surface warped or bowed? LA same-day. Vulcan, Garland, Wolf Industrial, Star. Resurfacing + replacement. BHGS #A49573. $120 dx.",
    "src/pages/commercial/griddle-repair/uneven-heat-distribution.astro":
        "Commercial griddle cooks unevenly? Hot/cold spots. LA same-day. Vulcan, Garland, Star, Wells, Keating. Burner + thermostat. BHGS #A49573. $120 dx.",
    "src/pages/commercial/grill-repair/flame-out.astro":
        "Commercial grill lights then dies? Pilot, thermocouple, gas valve. LA same-day. Wolf Outdoor, Lynx Pro Sear, MagiKitch'n. BHGS #A49573. $120 dx.",
    "src/pages/commercial/holding-cabinet-repair/not-heating.astro":
        "Commercial holding cabinet won't heat? LA same-day. Alto-Shaam, Cres Cor, Hatco, Metro, Vollrath. FDA 140F compliance. BHGS #A49573. $120 dx.",
    "src/pages/commercial/ice-machines/not-making-ice.astro":
        "Restaurant ice machine stopped producing? LA same-day. Hoshizaki, Manitowoc, Scotsman, Ice-O-Matic. EPA 608 refrigerant. BHGS #A49573. $120 dx.",
    "src/pages/commercial/kettle-repair/leaking-steam.astro":
        "Commercial steam-jacketed kettle leaking? LA same-day. Cleveland Range, Groen, Vulcan. Steam jacket integrity test. BHGS #A49573. $120 commercial dx.",
    "src/pages/commercial/kettle-repair/not-heating.astro":
        "Commercial steam kettle not coming up to temp? LA same-day. Cleveland Range, Groen, Vulcan. Burner + steam supply. BHGS #A49573. $120 commercial dx.",
    "src/pages/commercial/kettle-repair/tilt-mechanism-issues.astro":
        "Commercial tilting kettle mechanism stuck or leaking? LA same-day. Cleveland, Groen, Vulcan. Hydraulic + manual tilt. BHGS #A49573. $120 dx.",
    "src/pages/commercial/range-repair/french-top-range-repair.astro":
        "Commercial French top range repair across LA, OC, Ventura. Solid steel plate specialty. Vulcan, Jade, Bonnet, Lacanche. BHGS #A49573. $120 dx.",
    "src/pages/commercial/range-repair/gas-range-repair.astro":
        "Commercial gas range repair across LA, OC, Ventura. Vulcan, Garland, Imperial, Wolf, Montague. 6-burner, 10-burner, with oven. BHGS #A49573. $120 dx.",
    "src/pages/commercial/range-repair/oven-not-heating.astro":
        "Commercial range oven won't heat? LA same-day. Vulcan, Garland, Imperial, Wolf, Montague. Burner + thermostat + safety valve. BHGS #A49573. $120 dx.",
    "src/pages/commercial/range-repair/pilot-light-issues.astro":
        "Commercial range pilot light won't stay lit? Thermocouple + gas valve. LA same-day. Vulcan, Garland, Imperial, Wolf. BHGS #A49573. $120 commercial dx.",
    "src/pages/commercial/range-repair/restaurant-range-salamander-repair.astro":
        "Restaurant range salamander broiler repair across LA, OC, Ventura. Vulcan, Garland, Imperial. Premium niche specialists. BHGS #A49573. $120 dx.",
    "src/pages/commercial/steamer-repair/water-issues.astro":
        "Commercial steamer water supply issues? LA same-day. Annual descaling PM. Cleveland, Groen, AccuTemp, Vulcan. BHGS #A49573. $120 commercial dx.",
    "src/pages/commercial/washer-repair/leaking-water.astro":
        "Commercial washer leaking water? LA same-day. Speed Queen, UniMac, Continental Girbau, Dexter, Maytag Commercial. BHGS #A49573, EPA 608. $120 dx.",
    "src/pages/commercial/washer-repair/brands/continental-girbau.astro":
        "Continental Girbau commercial laundry repair across SoCal. Spanish Girbau parent. Hard-mount + soft-mount washers. BHGS #A49573, EPA 608. $120 dx.",
    "src/pages/commercial/washer-repair/brands/dexter.astro":
        "Dexter Laundry commercial washer repair across SoCal. Independent Iowa worker-owned cooperative since 1894. BHGS #A49573, EPA 608. $120 commercial dx.",
    "src/pages/commercial/washer-repair/brands/fagor-industrial.astro":
        "Fagor Industrial commercial laundry repair across SoCal. Onnera Group Spanish parent. Front-load + barrier washers. BHGS #A49573, EPA 608. $120 dx.",
    "src/pages/commercial/washer-repair/brands/speed-queen.astro":
        "Speed Queen commercial washer repair across SoCal. Alliance Laundry Systems Ripon WI. SC, FT, FX series. BHGS #A49573, EPA 608. $120 commercial dx.",
    "src/pages/commercial/steamer-repair/brands/vulcan.astro":
        "Vulcan commercial steamer repair across LA + OC. ITW Food Equipment Group brand since 1986. Pressure + pressureless. BHGS #A49573. $120 commercial dx.",
    "src/pages/commercial/refrigeration/brands/delfield.astro":
        "Delfield commercial refrigeration repair across SoCal. Welbilt portfolio (Ali Group). Reach-ins, prep tables, mega tops. BHGS #A49573, EPA 608. $120 dx.",
    "src/pages/commercial/ice-machines/brands/follett.astro":
        "Follett ice machine repair across SoCal. Healthcare + restaurants. Chewblet nugget, Symphony Plus. BHGS #A49573, EPA 608 universal. $120 commercial dx.",
    "src/pages/commercial/ice-machines/soft-serve/index.astro":
        "Same-day slushie + frozen drink machine repair across LA. Bunn, Crathco, Donper, Taylor. Compressor, draw valve, mix tank. BHGS #A49573, EPA 608. $120 dx.",
    "src/pages/commercial/holding-cabinet-repair/brands/cres-cor.astro":
        "Cres Cor heated holding cabinet repair across LA + OC. Independent Ohio family since 1936. Roll-in, half-size. BHGS #A49573. $120 commercial dx.",
    "src/pages/commercial/holding-cabinet-repair/brands/hatco.astro":
        "Hatco countertop heated holding repair across LA + OC. Independent Milwaukee since 1950. Heat lamps, drawers. BHGS #A49573. $120 commercial dx.",
}


def main():
    import re, json
    # Need original (long) descriptions to replace. Load violations.json for that.
    violations = json.loads(Path("scripts/wave-33-violations.json").read_text(encoding="utf-8"))
    by_file = {v["file"]: v for v in violations}

    # Also load report to get the over-shortened originals (still in file)
    # Actually violations.json IS the source of truth (taken before any edit) for these 56.

    succeeded = []
    failed = []
    out_of_range = []

    for file_path, new_desc in REWRITES.items():
        n = len(new_desc)
        if n < 130 or n > 155:
            out_of_range.append((file_path, n, new_desc))
            continue
        v = by_file.get(file_path)
        if not v:
            # Not in violations? Try reading current description directly.
            # For 14 still-long after sweep, the file's CURRENT description is the algorithm output (>160).
            # We need that as the "old" to replace. Let me grab it.
            text = Path(file_path).read_text(encoding="utf-8")
            m = re.search(r'const\s+description\s*=\s*"((?:[^"\\]|\\.)*?)"', text, re.S)
            if not m:
                m = re.search(r"const\s+description\s*=\s*'((?:[^'\\]|\\.)*?)'", text, re.S)
            if not m:
                m = re.search(r"const\s+description\s*=\s*`((?:[^`\\]|\\.)*?)`", text, re.S)
            if m:
                raw = m.group(1)
                old_desc = (raw.replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"').replace("\\'", "'").replace("\\\\", "\\"))
            else:
                failed.append((file_path, "no-description-found"))
                continue
        else:
            old_desc = v["description"]
        ok = replace_in_file(Path(file_path), old_desc, new_desc, '"')
        if ok:
            succeeded.append((file_path, len(old_desc), n))
        else:
            failed.append((file_path, "replace-failed"))

    print(f"Succeeded: {len(succeeded)}")
    for fp, old, new in succeeded:
        print(f"  [{old} -> {new}] {fp}")
    if out_of_range:
        print(f"\nOut-of-range drafts (skipped):")
        for fp, n, d in out_of_range:
            print(f"  [{n}] {fp}: {d}")
    if failed:
        print(f"\nFailed:")
        for fp, reason in failed:
            print(f"  [{reason}] {fp}")


if __name__ == "__main__":
    main()
