#!/usr/bin/env python3
"""Parse each of 5 county hub .astro files for per-hub anatomy."""
import os, re, json, csv
from collections import Counter

ROOT = r"C:/Users/Roman/WebstormProjects/sdar-v2"
OUT = os.path.join(ROOT, "scripts/county-audit-2026-05-22")

COUNTIES = [
    ("Los Angeles", "los-angeles-county"),
    ("Orange", "orange-county"),
    ("Ventura", "ventura-county"),
    ("San Bernardino", "san-bernardino-county"),
    ("Riverside", "riverside-county"),
]

LA_CITIES = ["Los Angeles","West Hollywood","Beverly Hills","Santa Monica","Pasadena","Glendale","Burbank","Brentwood","Silver Lake","Culver City","Manhattan Beach","Studio City","Sherman Oaks","Encino","Woodland Hills","Marina del Rey","Redondo Beach","Long Beach","Koreatown","Highland Park","Atwater Village","Eagle Rock","Malibu","Pacific Palisades","Calabasas","Los Feliz"]
OC_CITIES = ["Irvine","Newport Beach","Anaheim","Huntington Beach","Laguna Beach","Costa Mesa","Fullerton","Santa Ana","Tustin","Yorba Linda","Lake Forest","Mission Viejo","Garden Grove","Orange"]
VC_CITIES = ["Thousand Oaks","Westlake Village","Camarillo","Simi Valley","Oxnard","Ventura","Newbury Park","Moorpark","Agoura Hills"]
SB_CITIES = ["Rancho Cucamonga","Chino Hills","Upland","Ontario","Fontana","San Bernardino","Redlands","Yucaipa","Chino"]
RC_CITIES = ["Temecula","Murrieta","Corona","Menifee","Riverside","Moreno Valley","Hemet","Lake Elsinore"]

COUNTY_CITIES = {
    "los-angeles-county": LA_CITIES,
    "orange-county": OC_CITIES,
    "ventura-county": VC_CITIES,
    "san-bernardino-county": SB_CITIES,
    "riverside-county": RC_CITIES,
}

BRANDS = ["LG","Samsung","Whirlpool","GE","Maytag","KitchenAid","Bosch","Sub-Zero","Wolf","Viking","Thermador","Miele","Liebherr","JennAir","Jenn-Air","Dacor","Electrolux","Amana","Frigidaire","Fisher & Paykel","Asko","Gaggenau"]
SERVICES = ["refrigerator","fridge","freezer","dishwasher","dryer","washer","washing machine","stove","range","oven","cooktop","microwave","wine cooler","ice maker","ice machine","garbage disposal","walk-in cooler","walk-in freezer","walk in cooler","walk in freezer"]

def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()

def extract_body_text(astro_src):
    # Remove frontmatter (---...---)
    m = re.search(r"^---\n.*?\n---\n", astro_src, re.DOTALL)
    if m:
        astro_src = astro_src[m.end():]
    # Remove <style> blocks
    astro_src = re.sub(r"<style[\s\S]*?</style>", " ", astro_src, flags=re.IGNORECASE)
    # Remove <script> blocks (incl JSON-LD)
    astro_src = re.sub(r"<script[\s\S]*?</script>", " ", astro_src, flags=re.IGNORECASE)
    # Strip tags
    body = strip_tags(astro_src)
    return body

def count_phrases(text, phrases, case_insensitive=True):
    out = Counter()
    flags = re.IGNORECASE if case_insensitive else 0
    for p in phrases:
        n = len(re.findall(r"\b" + re.escape(p) + r"\b", text, flags=flags))
        if n:
            out[p] = n
    return out

results = []
for name, slug in COUNTIES:
    path = os.path.join(ROOT, "src/pages", f"{slug}.astro")
    src = open(path, "r", encoding="utf-8").read()
    body = extract_body_text(src)
    words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", body.lower())
    wc = len(words)

    # Title / desc (from frontmatter)
    title = re.search(r'const\s+title\s*=\s*"([^"]+)"', src)
    desc  = re.search(r'const\s+description\s*=\s*"([^"]+)"', src)
    title = title.group(1) if title else ""
    desc = desc.group(1) if desc else ""

    # H1
    h1 = re.findall(r"<h1[^>]*>([\s\S]*?)</h1>", src)
    h1 = [strip_tags(h) for h in h1]
    h2 = re.findall(r"<h2[^>]*>([\s\S]*?)</h2>", src)
    h2 = [strip_tags(h) for h in h2]

    # FAQ
    faq_q = re.findall(r'"@type":\s*"Question"', src)

    # Cities in body
    cities = count_phrases(body, COUNTY_CITIES[slug])
    # Brands in body
    brands = count_phrases(body, BRANDS)
    # Services in body
    services = count_phrases(body, SERVICES)

    # Internal links — services / cities / phone / other counties / repair pages
    links = re.findall(r'href="([^"]+)"', src)
    tel_links = [l for l in links if l.startswith("tel:")]
    internal = [l for l in links if l.startswith("/") and not l.startswith("//")]
    city_links_in_county = [l for l in internal if any(re.search(r"/" + re.escape(c.lower().replace(" ","-")) + r"/?", l) for c in COUNTY_CITIES[slug])]
    other_county_links = [l for l in internal if "-county" in l and slug not in l]
    service_links = [l for l in internal if "/services/" in l or "/commercial/" in l or "-repair" in l]
    brand_links = [l for l in internal if "/brands/" in l]

    # Schema types
    schemas = re.findall(r'"@type":\s*"([^"]+)"', src)
    schema_counter = Counter(schemas)

    # Photos
    imgs = re.findall(r'<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"', src)
    imgs2 = re.findall(r'<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"', src)
    pictures = re.findall(r'<picture', src)

    # Recent repairs / repair-card count
    repair_cards = len(re.findall(r'class="repair-card"', src))

    result = {
        "county": name,
        "slug": slug,
        "title": title,
        "title_length": len(title),
        "description": desc,
        "description_length": len(desc),
        "h1": h1[0] if h1 else "",
        "h2_count": len(h2),
        "h2_texts": "; ".join(h2),
        "wordcount_body": wc,
        "faq_questions": len(faq_q),
        "cities_in_county_mentioned": dict(cities),
        "cities_mentioned_count": len(cities),
        "cities_mention_total": sum(cities.values()),
        "brands_mentioned": dict(brands),
        "brands_mentioned_count": len(brands),
        "services_mentioned": dict(services),
        "services_mentioned_count": len(services),
        "links_total": len(links),
        "links_tel": len(tel_links),
        "links_tel_unique": len(set(tel_links)),
        "links_internal": len(internal),
        "links_city_in_county": len(city_links_in_county),
        "links_other_county": len(other_county_links),
        "links_service": len(service_links),
        "links_brand": len(brand_links),
        "schema_types": dict(schema_counter),
        "img_tags": len(imgs) + len(imgs2),
        "picture_tags": len(pictures),
        "repair_cards": repair_cards,
    }
    results.append(result)
    print(f"\n=== {name} County ({slug}) ===")
    print(f"  title ({len(title)}): {title}")
    print(f"  description ({len(desc)}): {desc[:100]}...")
    print(f"  H1: {h1[0] if h1 else '(none)'}")
    print(f"  H2 count: {len(h2)}, FAQ Qs: {len(faq_q)}")
    print(f"  Wordcount body: {wc}")
    print(f"  Cities in-county mentioned: {len(cities)} unique, {sum(cities.values())} total")
    print(f"    top: {dict(cities.most_common(8))}")
    print(f"  Brands mentioned: {len(brands)} unique — {dict(brands.most_common(10))}")
    print(f"  Services mentioned: {len(services)} unique")
    print(f"    top: {dict(services.most_common(8))}")
    print(f"  Links: total={len(links)} internal={len(internal)} tel={len(tel_links)} (uniq={len(set(tel_links))})")
    print(f"    city-in-county={len(city_links_in_county)}  other-county={len(other_county_links)}  service={len(service_links)}  brand={len(brand_links)}")
    print(f"  Schema types: {dict(schema_counter)}")
    print(f"  Img tags: {len(imgs)+len(imgs2)}  <picture>: {len(pictures)}  repair-cards: {repair_cards}")

# Save CSV
with open(os.path.join(OUT, "per-hub-anatomy.csv"), "w", newline="", encoding="utf-8") as f:
    fields = ["county","slug","title","title_length","description","description_length",
              "h1","h2_count","wordcount_body","faq_questions",
              "cities_mentioned_count","cities_mention_total","brands_mentioned_count","services_mentioned_count",
              "links_total","links_internal","links_tel","links_tel_unique",
              "links_city_in_county","links_other_county","links_service","links_brand",
              "img_tags","picture_tags","repair_cards"]
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for r in results:
        w.writerow({k: r.get(k, "") for k in fields})

# Save full JSON
with open(os.path.join(OUT, "per-hub-anatomy.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n=== DONE ===")
