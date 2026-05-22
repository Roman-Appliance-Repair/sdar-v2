"""Wave 39 Phase 2B — audit commercial pages, classify by type, generate target titles.

Page types:
  - main_hub: src/pages/commercial/index.astro (skip — custom)
  - service_hub: src/pages/commercial/{equipment}-repair.astro
                 OR src/pages/commercial/{equipment}/index.astro
  - sub_service: src/pages/commercial/{equipment}-repair/{slug}.astro
                 OR src/pages/commercial/{equipment}/{slug}.astro
  - brand: src/pages/commercial/{equipment}-repair/brands/{brand}.astro
           OR src/pages/commercial/{equipment}/brands/{brand}.astro
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
COMM_DIR = ROOT / "src" / "pages" / "commercial"

EQUIPMENT_DISPLAY = {
    # Cooking
    "grill": "Grill",
    "griddle": "Griddle",
    "fryer": "Fryer",
    "oven": "Oven",
    "pizza-oven": "Pizza Oven",
    "convection-oven": "Convection Oven",
    "combi-oven": "Combi Oven",
    "rotisserie-oven": "Rotisserie Oven",
    "range": "Range",
    "stove": "Stove",
    "charbroiler": "Charbroiler",
    "salamander": "Salamander",
    "kettle": "Kettle",
    "steamer": "Steamer",
    "holding-cabinet": "Holding Cabinet",
    # Refrigeration umbrella
    "refrigeration": "Refrigeration",
    "refrigerator": "Refrigerator",
    "walk-in-cooler": "Walk-In Cooler",
    "walk-in-freezer": "Walk-In Freezer",
    "reach-in-cooler": "Reach-In Cooler",
    "reach-in-freezer": "Reach-In Freezer",
    "prep-table": "Prep Table",
    "undercounter-refrigerator": "Undercounter Refrigerator",
    "display-case": "Display Case",
    "wine-cellar-cooling": "Wine Cellar Cooling",
    # Ice / dispense
    "ice-machine": "Ice Machine",
    "ice-machines": "Ice Machine",
    # Cleaning / wash
    "dishwasher": "Dishwasher",
    "glass-washer": "Glass Washer",
    "rack-conveyor-dishwasher": "Rack Conveyor Dishwasher",
    "flight-type-dishwasher": "Flight-Type Dishwasher",
    "undercounter-dishwasher": "Undercounter Dishwasher",
    # Laundry
    "washer": "Washer",
    "dryer": "Dryer",
    "laundry": "Laundry",
    "stack-washer-dryer": "Stack Washer & Dryer",
    "industrial-laundry": "Industrial Laundry",
    "coin-laundry": "Coin Laundry",
    "on-premise-laundry": "OPL",
    # Prep
    "mixer": "Mixer",
    "slicer": "Slicer",
    "food-processor": "Food Processor",
    # Ventilation
    "exhaust-hood": "Exhaust Hood",
    "type-1-hood": "Type 1 Hood",
}

BRAND_DISPLAY = {
    # Ice machine
    "hoshizaki": "Hoshizaki",
    "manitowoc": "Manitowoc",
    "scotsman": "Scotsman",
    "ice-o-matic": "Ice-O-Matic",
    "follett": "Follett",
    "kold-draft": "Kold-Draft",
    # Refrigeration
    "true": "True",
    "true-manufacturing": "True Manufacturing",
    "turbo-air": "Turbo Air",
    "beverage-air": "Beverage-Air",
    "traulsen": "Traulsen",
    "delfield": "Delfield",
    "perlick": "Perlick",
    "continental": "Continental Refrigerator",
    "master-bilt": "Master-Bilt",
    "victory": "Victory",
    "arctic-air": "Arctic Air",
    # Cooking
    "vulcan": "Vulcan",
    "garland": "Garland",
    "wolf-commercial": "Wolf Commercial",
    "imperial": "Imperial",
    "southbend": "Southbend",
    "blodgett": "Blodgett",
    "rational": "Rational",
    "pitco": "Pitco",
    "frymaster": "Frymaster",
    "henny-penny": "Henny Penny",
    "cleveland-range": "Cleveland Range",
    "groen": "Groen",
    "accutemp": "AccuTemp",
    "market-forge": "Market Forge",
    "alto-shaam": "Alto-Shaam",
    "cres-cor": "Cres Cor",
    "hatco": "Hatco",
    "metro": "Metro",
    "vollrath": "Vollrath",
    # Laundry
    "speed-queen": "Speed Queen",
    "unimac": "UniMac",
    "continental-girbau": "Continental",
    "huebsch": "Huebsch",
    "dexter": "Dexter",
    "milnor": "Milnor",
    "wascomat": "Wascomat",
    "fagor-industrial": "Fagor Industrial",
    # Dishwasher
    "hobart": "Hobart",
    "champion": "Champion",
    "jackson": "Jackson",
    # Mixer
    "kitchenaid-commercial": "KitchenAid Commercial",
    "univex": "Univex",
    "varimixer": "Varimixer",
    # Slicer
    "berkel": "Berkel",
    "bizerba": "Bizerba",
    "globe": "Globe",
    # Food processor
    "robot-coupe": "Robot Coupe",
}

# Sub-service slug → display (failure modes, equipment variants, vertical wraps)
SUB_SERVICE_DISPLAY = {
    # Failure modes (generic)
    "burner-not-lighting": "Burner Not Lighting",
    "burner-not-igniting": "Burner Not Igniting",
    "not-heating": "Not Heating",
    "not-cleaning": "Not Cleaning",
    "not-cooling": "Not Cooling",
    "not-spinning": "Not Spinning",
    "not-steaming": "Not Steaming",
    "not-making-ice": "Not Making Ice",
    "leaking-water": "Leaking Water",
    "water-leaking": "Water Leaking",
    "leaking-steam": "Leaking Steam",
    "uneven-heat": "Uneven Heat",
    "uneven-heat-distribution": "Uneven Heat Distribution",
    "temperature-recovery-slow": "Slow Temperature Recovery",
    "temperature-fluctuating": "Temperature Fluctuating",
    "temperature-recovery": "Slow Temperature Recovery",
    "compressor-issues": "Compressor Issues",
    "motor-issues": "Motor Issues",
    "motor-not-running": "Motor Not Running",
    "blade-issues": "Blade Issues",
    "bowl-lift-issues": "Bowl Lift Issues",
    "gear-transmission-issues": "Gear / Transmission Issues",
    "filter-system-issues": "Filter System Issues",
    "oil-leaking": "Oil Leaking",
    "scale-buildup": "Scale Buildup",
    "water-issues": "Water Issues",
    "humidity-control-failure": "Humidity Control Failure",
    "door-seal-issues": "Door Seal Issues",
    "thermostat-issues": "Thermostat Issues",
    "tilt-mechanism-issues": "Tilt Mechanism Issues",
    "safety-interlock-issues": "Safety Interlock Issues",
    "surface-warping": "Surface Warping",
    "pilot-light-issues": "Pilot Light Issues",
    "flame-out": "Flame Out",
    "grease-buildup": "Grease Buildup",
    "grease-trap-issues": "Grease Trap Issues",
    "grease-fire-prevention": "Grease Fire Prevention",
    "fan-not-working": "Fan Not Working",
    "fire-suppression-issues": "Fire Suppression Issues",
    "oven-not-heating": "Oven Not Heating",
    "error-codes": "Error Codes",
    "cleaning-service": "Cleaning Service",
    "hood-cleaning-service": "Hood Cleaning Service",
    "dispenser-repair": "Dispenser Repair",
    # Equipment variants
    "combi-oven-repair": "Combi Oven",
    "convection-oven-repair": "Convection Oven",
    "rotisserie-oven-repair": "Rotisserie Oven",
    "conveyor-pizza-oven-repair": "Conveyor Pizza Oven",
    "deck-pizza-oven-repair": "Deck Pizza Oven",
    "wood-fired-pizza-oven-repair": "Wood-Fired Pizza Oven",
    "open-pot-fryer-repair": "Open-Pot Fryer",
    "pressure-fryer-repair": "Pressure Fryer",
    "tube-fired-fryer-repair": "Tube-Fired Fryer",
    "french-top-range-repair": "French Top Range",
    "gas-range-repair": "Gas Range",
    "restaurant-range-salamander-repair": "Range Salamander",
    "electric-stove-repair": "Electric Stove",
    "gas-stove-repair": "Gas Stove",
    "induction-cooktop-repair": "Induction Cooktop",
    "rack-conveyor-dishwasher-repair": "Rack Conveyor Dishwasher",
    "flight-type-dishwasher-repair": "Flight-Type Dishwasher",
    "glass-washer-repair": "Glass Washer",
    "undercounter-dishwasher-repair": "Undercounter Dishwasher",
    "type-1-hood-repair": "Type 1 Hood",
    "make-up-air-system-repair": "Make-Up Air System",
    "cube-ice-repair": "Cube Ice Machine",
    "flake-ice-repair": "Flake Ice Machine",
    "nugget-ice-repair": "Nugget Ice Machine",
    # Vertical wraps (laundry)
    "on-premise-laundry-repair": "OPL Washer & Dryer",
    "industrial-laundry-repair": "Industrial Laundry",
    "coin-laundry-repair": "Coin Laundry",
    "stack-washer-dryer-repair": "Stack Washer & Dryer",
    # Refrigeration sub-equipment (when under refrigeration/)
    "display-case-repair": "Display Case",
    "prep-table-repair": "Prep Table",
    "reach-in-cooler-repair": "Reach-In Cooler",
    "reach-in-freezer-repair": "Reach-In Freezer",
    "undercounter-refrigerator-repair": "Undercounter Refrigerator",
    "walk-in-cooler-repair": "Walk-In Cooler",
    "walk-in-freezer-repair": "Walk-In Freezer",
    "wine-cellar-cooling-repair": "Wine Cellar Cooling",
}

TITLE_PATTERNS = [
    re.compile(r"<title>([^<]+)</title>"),
    re.compile(r"^title:\s*[\"']([^\"'\n]+)[\"']", re.MULTILINE),
    re.compile(r'const\s+title\s*=\s*"((?:[^"\\\n]|\\.)+)"'),
    re.compile(r"const\s+title\s*=\s*'((?:[^'\\\n]|\\.)+)'"),
    re.compile(r"const\s+title\s*=\s*`((?:[^`\\\n]|\\.)+)`"),
]


def classify_and_targets(rel_path: str) -> tuple[str, str | None]:
    """Return (page_type, target_title) or (page_type, None) if can't generate."""
    parts = rel_path.replace("\\", "/").split("/")
    # rel_path = "src/pages/commercial/.../X.astro"
    # parts[0..2] = src, pages, commercial
    rest = parts[3:]  # everything under commercial/
    name = rest[-1].replace(".astro", "")

    # Main hub
    if rest == ["index.astro"]:
        return ("main_hub", None)

    # Service hub (top-level): commercial/X.astro OR commercial/X/index.astro
    if len(rest) == 1 and name.endswith("-repair"):
        equipment_slug = name[:-len("-repair")]
        equip = EQUIPMENT_DISPLAY.get(equipment_slug)
        if equip:
            t = f"Commercial {equip} Repair Los Angeles — Same Day"
            if len(t) > 60:
                t = f"Commercial {equip} Repair LA — Same Day"
            return ("service_hub", t)
        return ("service_hub_unknown", None)

    # Service hub via index.astro under directory: commercial/X/index.astro
    if len(rest) == 2 and rest[1] == "index.astro":
        equipment_slug = rest[0]
        if equipment_slug.endswith("-repair"):
            equipment_slug = equipment_slug[:-len("-repair")]
        equip = EQUIPMENT_DISPLAY.get(equipment_slug)
        if equip:
            t = f"Commercial {equip} Repair Los Angeles — Same Day"
            if len(t) > 60:
                t = f"Commercial {equip} Repair LA — Same Day"
            return ("service_hub", t)
        return ("service_hub_unknown", None)

    # Brand page: commercial/X-repair/brands/Y.astro OR commercial/X/brands/Y.astro
    if len(rest) >= 3 and rest[-2] == "brands":
        brand_slug = name
        equipment_dir = rest[0]
        if equipment_dir.endswith("-repair"):
            equipment_slug = equipment_dir[:-len("-repair")]
        else:
            equipment_slug = equipment_dir
        equip = EQUIPMENT_DISPLAY.get(equipment_slug)
        brand = BRAND_DISPLAY.get(brand_slug)
        if brand and equip:
            t = f"{brand} {equip} Repair Los Angeles — Same Day"
            if len(t) > 60:
                t = f"{brand} {equip} Repair LA — Same Day"
            return ("brand", t)
        return ("brand_unknown", None)

    # Sub-service: commercial/X-repair/Y.astro OR commercial/X/Y.astro
    # OR commercial/refrigeration/Y.astro (where parent is refrigeration umbrella)
    if len(rest) == 2:
        sub_slug = name
        equipment_dir = rest[0]
        if equipment_dir.endswith("-repair"):
            parent_equipment = equipment_dir[:-len("-repair")]
        else:
            parent_equipment = equipment_dir

        sub_display = SUB_SERVICE_DISPLAY.get(sub_slug)
        parent_equip = EQUIPMENT_DISPLAY.get(parent_equipment)

        # Special case: parent = refrigeration, sub = walk-in-cooler-repair etc.
        # Treat as commercial-{equipment} hub-like.
        if parent_equipment == "refrigeration" and sub_slug.endswith("-repair"):
            sub_eq_slug = sub_slug[:-len("-repair")]
            sub_eq = EQUIPMENT_DISPLAY.get(sub_eq_slug, sub_display)
            if sub_eq:
                t = f"Commercial {sub_eq} Repair Los Angeles — Same Day"
                if len(t) > 60:
                    t = f"Commercial {sub_eq} Repair LA — Same Day"
                return ("refrigeration_sub", t)

        # Generic sub-service
        if sub_display and parent_equip:
            # Failure-mode template: "Commercial {Equip} {Mode} Repair LA — Same Day"
            # Or vertical wrap: "{Vertical} Repair LA — Same Day"
            # Decision rule: if sub_display starts with "OPL" / "Industrial" / "Coin" / "Stack",
            # it's a vertical wrap (different format).
            if any(sub_display.startswith(prefix) for prefix in ("OPL", "Industrial", "Coin", "Stack")):
                t = f"{sub_display} Repair Los Angeles — Same Day"
                if len(t) > 60:
                    t = f"{sub_display} Repair LA — Same Day"
                return ("sub_service_vertical", t)
            # Equipment-variant: e.g. "Combi Oven", "Conveyor Pizza Oven"
            if sub_slug.endswith("-repair"):
                t = f"Commercial {sub_display} Repair Los Angeles — Same Day"
                if len(t) > 60:
                    t = f"Commercial {sub_display} Repair LA — Same Day"
                return ("sub_service_variant", t)
            # Failure-mode: e.g. "Not Heating", "Burner Not Lighting"
            t = f"Commercial {parent_equip} {sub_display} LA — Same Day"
            if len(t) > 60:
                # Fallback 1: drop "Commercial"
                t = f"{parent_equip} {sub_display} LA — Same Day"
            if len(t) > 60:
                # Fallback 2: drop equipment if mode is descriptive enough
                t = f"{sub_display} LA — Same Day"
            return ("sub_service_failmode", t)
        return ("sub_service_unknown", None)

    # Soft-serve sub: commercial/ice-machines/soft-serve/index.astro
    if len(rest) == 3 and rest[2] == "index.astro" and rest[0] == "ice-machines":
        # Treat as service_hub for "Slushie / Soft Serve"
        sub_slug = rest[1]  # "soft-serve"
        if sub_slug == "soft-serve":
            t = "Commercial Soft Serve & Slushie Repair LA — Same Day"
            return ("service_hub_special", t)

    return ("unclassified", None)


# Run audit
type_counter: Counter = Counter()
results: list[tuple[str, str, str, str | None]] = []  # (rel, current, ptype, target)
for path in sorted(COMM_DIR.rglob("*.astro")):
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    text = path.read_text(encoding="utf-8")

    current_title = None
    for pat in TITLE_PATTERNS:
        m = pat.search(text)
        if m:
            current_title = m.group(1).strip()
            break

    page_type, target = classify_and_targets(rel)
    type_counter[page_type] += 1
    results.append((rel, current_title or "", page_type, target))

print(f"=== Wave 39 Phase 2B audit ===")
print(f"Total commercial .astro files: {len(results)}")
print()
print(f"=== Page type distribution ===")
for t, n in type_counter.most_common():
    print(f"  {t}: {n}")
print()

# Length stats for proposed targets
buckets: Counter = Counter()
over_60 = []
for rel, cur, ptype, target in results:
    if target is None:
        buckets["no_target"] += 1
        continue
    L = len(target)
    if L <= 50: buckets["<=50"] += 1
    elif L <= 60: buckets["51-60"] += 1
    elif L <= 70: buckets["61-70"] += 1
    else: buckets[">70"] += 1
    if L > 60:
        over_60.append((rel, target, L))

print(f"=== Target title length distribution ===")
for k in ["<=50", "51-60", "61-70", ">70", "no_target"]:
    print(f"  {k}: {buckets[k]}")
if over_60:
    print(f"\n=== Targets still >60 ({len(over_60)}) ===")
    for rel, t, L in sorted(over_60, key=lambda x: -x[2])[:20]:
        print(f"  [{L}] {rel}")
        print(f"        {t}")

# Sample 30 changes
print(f"\n=== Sample target titles (first 30) ===")
for rel, cur, ptype, target in results[:30]:
    if target is None:
        print(f"  ?? [{ptype}] {rel}")
        continue
    print(f"  [{len(target):>2}] {ptype:<22} {Path(rel).name[:35]:<37} {target}")

# Save full audit
out = ROOT / "audit-output" / "wave-39-phase2b-classify.json"
out.write_text(
    json.dumps(
        [
            {"file": rel, "current": cur, "type": ptype, "target": target}
            for rel, cur, ptype, target in results
        ],
        indent=2,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)

# Print files needing attention
unknowns = [(rel, ptype, cur) for rel, cur, ptype, target in results if target is None and ptype != "main_hub"]
if unknowns:
    print(f"\n=== Unclassified / no-target files (need attention) ===")
    for rel, ptype, cur in unknowns:
        print(f"  [{ptype}] {rel}")
        print(f"        cur: {cur[:80]}")
