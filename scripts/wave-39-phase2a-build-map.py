"""Wave 39 Phase 2A — derive brand slug → display name map (PILLARS ONLY).

A "pillar" slug is one that does NOT end in a known category suffix like
`-refrigerator-repair`, `-dryer-repair`, etc. — i.e., the slug IS the brand.

Strategy:
  1. Identify pillar files (slug doesn't end in -X-repair where X ∈ CATEGORIES)
  2. For each pillar, derive display name from existing title (first capitalized token)
  3. Apply manual overrides for irregular casing
  4. Save to audit-output/brand-display-map.json
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
BRANDS_DIR = ROOT / "src" / "pages" / "brands"

# Known category-suffix tokens. If slug ends in `-{category}-repair`, slug is a
# brand × category combo, not a pillar.
KNOWN_CATEGORIES = {
    # Residential
    "refrigerator", "freezer", "ice-maker", "wine-cooler", "wine-cellar",
    "washer", "dryer", "laundry", "stack-washer-dryer", "washer-dryer",
    "oven", "wall-oven", "range", "range-hood", "cooktop", "stove", "microwave",
    "dishwasher", "professional-dishwasher",
    "trash-compactor", "garbage-disposal",
    "coffee", "stand-mixer", "vent-hood", "hood",
    # Built-in / outdoor
    "built-in-refrigerator", "outdoor-refrigerator", "outdoor",
    "bbq-grill", "grill", "pizza-oven", "patio-heater", "fireplace",
    "outdoor-kitchen",
    # Commercial
    "ice-machine", "rotisserie", "fryer", "charbroiler", "steamer",
    "commercial", "commercial-dryer", "walk-in", "walk-in-cooler",
    "walk-in-freezer", "condensing-unit", "refrigeration",
    "draft-beer-system", "beverage-dispenser", "soft-serve",
    "slushie-machine", "convection-oven", "salamander",
    "tankless-water-heater",
}

TITLE_PATTERNS = [
    re.compile(r"<title>([^<]+)</title>"),
    re.compile(r"^title:\s*[\"']([^\"'\n]+)[\"']", re.MULTILINE),
    re.compile(r"const\s+title\s*=\s*[\"`]([^\"`\n]+)[\"`]"),
    re.compile(r"const\s+title\s*=\s*'([^'\n]+)'"),
]

MANUAL_DISPLAY = {
    "sub-zero": "Sub-Zero", "jennair": "JennAir",
    "ge": "GE", "ge-monogram": "GE Monogram", "ge-cafe": "GE Café",
    "ge-profile": "GE Profile", "lg": "LG", "kitchenaid": "KitchenAid",
    "fisher-paykel": "Fisher & Paykel", "u-line": "U-Line",
    "miele": "Miele", "thermador": "Thermador", "viking": "Viking",
    "wolf": "Wolf", "asko": "Asko", "amana": "Amana", "bosch": "Bosch",
    "dacor": "Dacor", "frigidaire": "Frigidaire", "haier": "Haier",
    "maytag": "Maytag", "samsung": "Samsung", "whirlpool": "Whirlpool",
    "kenmore": "Kenmore", "magic-chef": "Magic Chef", "speed-queen": "Speed Queen",
    "bluestar": "BlueStar", "blue-star": "BlueStar",
    "fulgor-milano": "Fulgor Milano", "ilve": "ILVE", "smeg": "Smeg",
    "bertazzoni": "Bertazzoni", "dcs": "DCS", "zline": "ZLINE", "z-line": "ZLINE",
    "tec": "TEC", "rcs": "RCS", "fagor": "Fagor", "perlick": "Perlick",
    "true": "True", "marvel": "Marvel", "summit": "Summit", "danby": "Danby",
    "monogram": "Monogram", "scotsman": "Scotsman", "manitowoc": "Manitowoc",
    "hoshizaki": "Hoshizaki", "ice-o-matic": "Ice-O-Matic",
    "follett": "Follett", "kold-draft": "Kold-Draft",
    "vulcan": "Vulcan", "garland": "Garland",
    "alto-shaam": "Alto-Shaam", "bki": "BKI", "blodgett": "Blodgett",
    "bakers-pride": "Bakers Pride", "lincoln-impinger": "Lincoln Impinger",
    "middleby-marshall": "Middleby Marshall", "rational": "Rational",
    "convotherm": "Convotherm", "cleveland-steam": "Cleveland",
    "groen": "Groen", "accutemp": "AccuTemp", "henny-penny": "Henny Penny",
    "frymaster": "Frymaster", "pitco": "Pitco",
    "globe": "Globe", "hobart": "Hobart", "berkel": "Berkel", "bizerba": "Bizerba",
    "anets": "Anets", "imperial": "Imperial", "south-bend": "South Bend",
    "vollrath": "Vollrath", "cooktek": "Cooktek",
    "twin-eagles": "Twin Eagles", "fire-magic": "Fire Magic",
    "lynx": "Lynx", "alfresco": "Alfresco", "kalamazoo": "Kalamazoo",
    "memphis": "Memphis", "broilmaster": "Broilmaster",
    "blaze": "Blaze", "summerset": "Summerset", "delta-heat": "Delta Heat",
    "weber": "Weber", "napoleon": "Napoleon", "saber": "Saber",
    "char-broil": "Char-Broil", "char-griller": "Char-Griller",
    "solaire": "Solaire", "broil-king": "Broil King",
    "bull": "Bull", "american-outdoor-grill": "American Outdoor Grill",
    "american-range": "American Range",
    "us-cooler": "U.S. Cooler", "master-bilt": "Master-Bilt",
    "nor-lake": "Nor-Lake", "kolpak": "Kolpak", "heatcraft": "Heatcraft",
    "sunpak": "Sunpak", "infratech": "Infratech",
    "bromic": "Bromic", "schwank": "Schwank", "calcana": "Calcana",
    "solaira": "Solaira", "fire-sense": "Fire Sense",
    "whisperkool": "WhisperKOOL", "cellarpro": "CellarPro",
    "wine-guardian": "Wine Guardian", "vinotemp": "Vinotemp",
    "le-cache": "Le Cache", "eurocave": "EuroCave",
    "valor": "Valor", "heat-glo": "Heat & Glo", "heat-and-glo": "Heat & Glo",
    "majestic": "Majestic", "regency": "Regency", "mendota": "Mendota",
    "lopi": "Lopi", "kozy-heat": "Kozy Heat",
    "real-fyre": "Real Fyre", "rinnai": "Rinnai", "noritz": "Noritz",
    "stiebel-eltron": "Stiebel Eltron", "navien": "Navien",
    "ao-smith": "A.O. Smith", "rheem": "Rheem", "bradford-white": "Bradford White",
    "trane": "Trane", "lennox": "Lennox", "carrier": "Carrier",
    "mitsubishi-electric": "Mitsubishi Electric",
    "beverage-air": "Beverage-Air", "avantco": "Avantco",
    "bunn": "BUNN", "huebsch": "Huebsch", "milnor": "Milnor",
    "continental-girbau": "Continental", "wascomat": "Wascomat",
    "jensen": "Jensen", "unimac": "UniMac",
    "primus": "Primus", "ipso": "IPSO",
    "adc": "ADC", "asko-laundry": "Asko",
    "perlick-draft-beer-system": "Perlick",
    "perlick-commercial": "Perlick", "true-commercial": "True",
    "traulsen-commercial": "Traulsen", "delfield-commercial": "Delfield",
    "aht-cooling-systems": "AHT Cooling Systems",
    "electrolux": "Electrolux", "gaggenau": "Gaggenau",
    "hotpoint": "Hotpoint", "blomberg": "Blomberg", "roper": "Roper",
    "beko": "Beko", "fivestar": "Five Star", "cove": "Cove",
    "big-chill": "Big Chill",
    "aga": "AGA", "accurex": "Accurex", "magikitchn": "MagiKitch'n",
    "wolf-charbroiler": "Wolf",
    # Derive-failure overrides
    "broan": "Broan",
    "panasonic": "Panasonic",
    "sharp": "Sharp",
    "captiveaire": "CaptiveAire",
    "breezaire": "Breezaire",
    "cma-dishmachines-repair": "CMA Dishmachines",
    # Wave 39 Phase 2A — parser-failure overrides (brands missing from map)
    "american-range": "American Range",
    "capital": "Capital",
    "champion": "Champion",
    "coyote": "Coyote",
    "dexter": "Dexter",
    "forno-bravo": "Forno Bravo",
    "gaylord": "Gaylord",
    "greenheck": "Greenheck",
    "halton": "Halton",
    "hestan": "Hestan",
    "jackson": "Jackson",
    "kratos": "Kratos",
    "la-cornue": "La Cornue",
    "lang": "Lang",
    "liebherr": "Liebherr",
    "lincoln": "Lincoln",
    "mainstreet-equipment": "MainStreet Equipment",
    "meiko": "Meiko",
    "montague": "Montague",
    "signature-kitchen-suite": "Signature Kitchen Suite",
    "southbend": "Southbend",
    "streivor": "Streivor",
    "turbochef": "TurboChef",
    "vent-master": "Vent Master",
    "winterhalter": "Winterhalter",
    "wood-stone": "Wood Stone",
}


def is_pillar(slug: str) -> bool:
    """A slug is a pillar if it doesn't end in a known category suffix."""
    if not slug.endswith("-repair"):
        return True  # e.g. 'beverage-air', 'amana'
    body = slug[:-len("-repair")]
    # Try every known category as suffix
    for cat in KNOWN_CATEGORIES:
        suffix = "-" + cat
        if body.endswith(suffix):
            # The remainder must be non-empty (otherwise the WHOLE slug is just
            # the category, which means it's a stand-alone like /brands/refrigerator-repair/
            # — not actually a brand)
            remainder = body[:-len(suffix)]
            if remainder:
                return False
    return True  # ends in -repair but no known cat suffix → treat as pillar


def derive_from_title(title: str) -> str | None:
    """First capitalized token / phrase up to first 'Repair'/'Appliance'/category word."""
    m = re.match(
        r"^([A-Z][\w\.&'\-]*(?:\s+[A-Z][\w\.&'\-]*){0,2})\s+(?:Appliance|Repair|Refrigerator|Range|Oven|Cooktop|Dishwasher|Washer|Dryer|Microwave|Wall|Wine|Ice|Freezer|Built-In|Outdoor|Stove|Pizza|BBQ|Charbroiler|Steam|Speed|Coffee|Vent|Hood|Grill|Trash|Beverage|Drawer|Column|Service)",
        title,
    )
    if m:
        return m.group(1).strip()
    m = re.match(r"^([A-Z][\w\.&'\-]+)", title)
    if m:
        return m.group(1).strip()
    return None


brand_map: dict[str, str] = {}
pillars: list[str] = []
non_pillars: list[str] = []
no_title: list[str] = []
no_extract: list[tuple[str, str]] = []

for path in sorted(BRANDS_DIR.glob("*.astro")):
    slug = path.stem
    if slug == "index":
        continue

    if is_pillar(slug):
        pillars.append(slug)
    else:
        non_pillars.append(slug)
        continue  # category pages don't go in brand_map directly

    text = path.read_text(encoding="utf-8")
    title = None
    for pat in TITLE_PATTERNS:
        m = pat.search(text)
        if m:
            title = m.group(1).strip()
            break

    if title is None:
        no_title.append(slug)
        continue

    derived = derive_from_title(title)
    if derived is None:
        no_extract.append((slug, title))
        continue

    brand_map[slug] = derived

# Manual overrides win over derived
for slug, display in MANUAL_DISPLAY.items():
    brand_map[slug] = display

# Save map
out = ROOT / "audit-output" / "brand-display-map.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(brand_map, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"=== Brand pillar map ===")
print(f"Total .astro files: {len(list(BRANDS_DIR.glob('*.astro')))}")
print(f"Pillar slugs (slug = brand): {len(pillars)}")
print(f"Non-pillar slugs (brand × category combos): {len(non_pillars)}")
print(f"Brand map entries (with manual overrides): {len(brand_map)}")
print()
print(f"=== Pillar map sample (first 30) ===")
for slug in sorted(pillars)[:30]:
    display = brand_map.get(slug, "(missing)")
    print(f"  {slug:<35}  ->  {display}")

print()
print(f"=== Manual override coverage ===")
manual_only = set(MANUAL_DISPLAY.keys()) - set(pillars)
print(f"Overrides for non-pillar / non-existent slugs: {len(manual_only)}")
if manual_only:
    for s in sorted(manual_only)[:10]:
        print(f"  {s}  ->  {MANUAL_DISPLAY[s]} (no pillar file)")

if no_title:
    print(f"\n=== Files with no title ({len(no_title)}) ===")
    for s in no_title[:10]: print(f"  {s}")

if no_extract:
    print(f"\n=== Title extract failed ({len(no_extract)}) ===")
    for s, t in no_extract[:10]: print(f"  {s}: {t[:80]}")

print()
print(f"=== Non-pillar slug sample (will be parsed by STEP 3) ===")
for s in sorted(non_pillars)[:15]:
    print(f"  {s}")
