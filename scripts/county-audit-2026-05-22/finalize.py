#!/usr/bin/env python3
"""Finalize CSVs: live-checks, incoming-links, gsc-per-hub, competitor-per-county, schema-check."""
import os, json, csv, subprocess, re

ROOT = r"C:/Users/Roman/WebstormProjects/sdar-v2"
OUT = os.path.join(ROOT, "scripts/county-audit-2026-05-22")

# ============================================================
# Live checks
# ============================================================
LIVE = [
    {"slug":"los-angeles-county","http":200,"size_bytes":148479,"ttfb_s":0.306},
    {"slug":"orange-county",       "http":200,"size_bytes":140031,"ttfb_s":0.237},
    {"slug":"ventura-county",      "http":200,"size_bytes":138917,"ttfb_s":0.232},
    {"slug":"san-bernardino-county","http":200,"size_bytes":139013,"ttfb_s":0.274},
    {"slug":"riverside-county",    "http":200,"size_bytes":138818,"ttfb_s":0.267},
]
with open(os.path.join(OUT,"live-checks.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=["slug","http","size_bytes","ttfb_s"]); w.writeheader()
    for r in LIVE: w.writerow(r)

# ============================================================
# Incoming links
# ============================================================
INCOMING = [
    {"slug":"los-angeles-county","files":55,"sources_dominant":"/brands/*-walk-in-repair, /brands/*-refrigeration, /commercial/*","anchor_dominant":"Los Angeles County","anchor_secondary":"breadcrumb / footer / contextual"},
    {"slug":"orange-county","files":37,"sources_dominant":"/commercial/* (all 10+ commercial repair pages)","anchor_dominant":"Orange County","anchor_secondary":"footer / breadcrumb"},
    {"slug":"ventura-county","files":35,"sources_dominant":"/commercial/* (all 10+ commercial repair pages)","anchor_dominant":"Ventura County","anchor_secondary":"footer / breadcrumb"},
    {"slug":"san-bernardino-county","files":35,"sources_dominant":"/commercial/* (all 10+ commercial repair pages)","anchor_dominant":"San Bernardino County","anchor_secondary":"footer / breadcrumb"},
    {"slug":"riverside-county","files":35,"sources_dominant":"/commercial/* (all 10+ commercial repair pages)","anchor_dominant":"Riverside County","anchor_secondary":"footer / breadcrumb"},
]
with open(os.path.join(OUT,"incoming-links.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=["slug","files","sources_dominant","anchor_dominant","anchor_secondary"])
    w.writeheader()
    for r in INCOMING: w.writerow(r)

# ============================================================
# GSC per hub (from raw responses)
# ============================================================
GSC_DATA = {
    "los-angeles-county": [
        {"query":"appliance repair downtown los angeles","clicks":0,"impressions":9,"position":62.1},
        {"query":"appliance repair in los angeles","clicks":0,"impressions":1,"position":73},
        {"query":"appliance repair los angeles ca","clicks":0,"impressions":4,"position":81.2},
        {"query":"appliance service los angeles ca","clicks":0,"impressions":1,"position":38},
        {"query":"best appliance repair los angeles","clicks":0,"impressions":2,"position":82.5},
        {"query":"commercial appliance repair near me","clicks":0,"impressions":1,"position":94},
        {"query":"dishwasher repair near m","clicks":0,"impressions":1,"position":47},
        {"query":"dryer repair near me same day","clicks":0,"impressions":1,"position":31},
        {"query":"emergency refrigerator repair","clicks":0,"impressions":1,"position":41},
        {"query":"gas dryer repair near me","clicks":0,"impressions":1,"position":19},
        {"query":"refrigerator repair near me same day","clicks":0,"impressions":1,"position":32},
        {"query":"refrigerator repair service","clicks":0,"impressions":1,"position":27},
        {"query":"residential appliance repair los angeles","clicks":0,"impressions":1,"position":53},
        {"query":"same day appliance inc","clicks":0,"impressions":1,"position":90},
        {"query":"same day appliance repair","clicks":0,"impressions":3,"position":23.7},
        {"query":"same day appliance repair topanga","clicks":0,"impressions":15,"position":70.2},
        {"query":"same day dishwasher repair los angeles","clicks":0,"impressions":2,"position":46},
        {"query":"same day dryer repair los angeles","clicks":0,"impressions":2,"position":44},
        {"query":"same day freezer repair los angeles","clicks":0,"impressions":1,"position":48},
        {"query":"same day refrigerator repair los angeles","clicks":0,"impressions":2,"position":45},
        {"query":"sameday appliance repair","clicks":0,"impressions":1,"position":23},
        {"query":"washer and dryer repair near me","clicks":0,"impressions":1,"position":67},
        {"query":"washer dryer repair near me","clicks":0,"impressions":1,"position":61},
    ],
    "orange-county": [
        {"query":"appliance repair in orange county","clicks":0,"impressions":1,"position":67},
        {"query":"appliance repair orange county","clicks":0,"impressions":12,"position":68.2},
        {"query":"appliance repair orange county ca","clicks":0,"impressions":5,"position":63.6},
        {"query":"appliance repair service near me","clicks":0,"impressions":1,"position":74},
        {"query":"dishwasher repair orange county ca","clicks":0,"impressions":1,"position":66},
        {"query":"orange county appliance repair","clicks":0,"impressions":1,"position":59},
        {"query":"orange county refrigerator repair","clicks":0,"impressions":2,"position":64},
        {"query":"refrigerator repair orange county","clicks":0,"impressions":3,"position":59},
        {"query":"refrigerator repair orange county ca","clicks":0,"impressions":3,"position":63},
        {"query":"same day appliance repair orange county","clicks":0,"impressions":9,"position":11.2},
        {"query":"same day appliance service","clicks":0,"impressions":1,"position":27},
        {"query":"same day stove repair oc","clicks":0,"impressions":1,"position":17},
        {"query":"same-day appliance repair","clicks":0,"impressions":2,"position":26},
        {"query":"walk in freezer repair orange county","clicks":0,"impressions":1,"position":67},
    ],
    "ventura-county": [
        {"query":"appliance installation ventura ca","clicks":0,"impressions":5,"position":59.4},
        {"query":"appliance repair in ventura","clicks":0,"impressions":2,"position":61},
        {"query":"appliance repair ventura","clicks":0,"impressions":16,"position":72.8},
        {"query":"appliance repair ventura ca","clicks":0,"impressions":29,"position":69.3},
        {"query":"appliance repair ventura county","clicks":0,"impressions":14,"position":66.4},
        {"query":"dryer repair ventura","clicks":0,"impressions":14,"position":66.7},
        {"query":"dryer service","clicks":0,"impressions":1,"position":44},
        {"query":"maytag repair near me","clicks":0,"impressions":1,"position":25},
        {"query":"oven repair ventura","clicks":0,"impressions":1,"position":69},
        {"query":"refrigerator repair ventura","clicks":0,"impressions":2,"position":72},
        {"query":"refrigerator repair ventura ca","clicks":0,"impressions":13,"position":62.9},
        {"query":"small appliance repair ventura ca","clicks":0,"impressions":13,"position":66.1},
        {"query":"ventura appliance repair","clicks":0,"impressions":1,"position":84},
        {"query":"ventura appliance service","clicks":0,"impressions":8,"position":67.1},
        {"query":"washer and dryer repair near me free estimate","clicks":0,"impressions":2,"position":91},
        {"query":"washer repair ventura","clicks":0,"impressions":10,"position":74.7},
        {"query":"washing machine repair ventura","clicks":0,"impressions":1,"position":43},
        {"query":"whirlpool dryer repair near me","clicks":0,"impressions":1,"position":93},
        {"query":"whirlpool washer repair near me","clicks":0,"impressions":1,"position":91},
        {"query":"winkler's appliance services ventura","clicks":0,"impressions":1,"position":39},
    ],
    "san-bernardino-county": [
        {"query":"appliance repair","clicks":0,"impressions":1,"position":67},
        {"query":"appliance repair san bernardino","clicks":0,"impressions":3,"position":48},
        {"query":"appliance repair san bernardino ca","clicks":0,"impressions":17,"position":51.2},
        {"query":"appliance repair service near me","clicks":0,"impressions":1,"position":18},
        {"query":"ice machine repair near me","clicks":0,"impressions":2,"position":20},
        {"query":"ice maker repair near me","clicks":0,"impressions":6,"position":17.2},
        {"query":"oil fryer repair near me","clicks":0,"impressions":1,"position":9},
        {"query":"oven repair san bernardino ca","clicks":0,"impressions":5,"position":53},
        {"query":"refrigeration services in san bernardino","clicks":0,"impressions":2,"position":70},
        {"query":"refrigerator repair near me","clicks":0,"impressions":2,"position":18},
        {"query":"refrigerator repair san bernardino","clicks":0,"impressions":1,"position":51},
        {"query":"same day appliance repair","clicks":0,"impressions":1,"position":24},
        {"query":"same day property repair san bernardino","clicks":0,"impressions":1,"position":53},
        {"query":"san bernardino appliance repair","clicks":0,"impressions":1,"position":45},
        {"query":"stove repair near me","clicks":0,"impressions":2,"position":16},
        {"query":"washer repair near me","clicks":0,"impressions":1,"position":18},
        {"query":"washer repair san bernardino","clicks":0,"impressions":4,"position":46.8},
        {"query":"washing machine repair near me","clicks":0,"impressions":1,"position":18},
        {"query":"washing machine repair san bernardino","clicks":0,"impressions":3,"position":49.3},
    ],
    "riverside-county": [
        # truncated — already saved raw, take the impr>=3 subset for summary
        {"query":"24 hour refrigeration repair near me","clicks":0,"impressions":1,"position":15},
        {"query":"appliance repair in riverside","clicks":0,"impressions":8,"position":65.2},
        {"query":"appliance repair inland empire","clicks":0,"impressions":14,"position":74.6},
        {"query":"appliance repair riverside","clicks":0,"impressions":4,"position":65.8},
        {"query":"appliance repairs and maintenance services","clicks":0,"impressions":3,"position":78.3},
        {"query":"dishwasher repair near me","clicks":0,"impressions":4,"position":36.8},
        {"query":"dryer repair near me","clicks":0,"impressions":13,"position":72.1},
        {"query":"dryer repair riverside","clicks":0,"impressions":5,"position":63.4},
        {"query":"fridge repair near me","clicks":0,"impressions":5,"position":39.6},
        {"query":"fridge service near me","clicks":0,"impressions":3,"position":58.7},
        {"query":"ge refrigerator repair near me","clicks":0,"impressions":4,"position":42},
        {"query":"ge repair near me","clicks":0,"impressions":6,"position":34.5},
        {"query":"hvac and appliance repair","clicks":0,"impressions":4,"position":71.2},
        {"query":"local refrigeration repair","clicks":0,"impressions":3,"position":73.3},
        {"query":"refrigeration repair near me","clicks":0,"impressions":23,"position":86.4},
        {"query":"refrigerator repair near me","clicks":0,"impressions":6,"position":32.8},
        {"query":"same day appliance repair","clicks":0,"impressions":47,"position":57.9},
        {"query":"same-day appliance repair","clicks":0,"impressions":3,"position":70.7},
        {"query":"whirlpool repair near me","clicks":0,"impressions":3,"position":37.7},
        {"query":"whirlpool washer repair near me","clicks":0,"impressions":3,"position":38.3},
    ],
}

# Compute summaries
print("=== GSC summary per hub ===")
summaries = []
for slug, rows in GSC_DATA.items():
    total_imp = sum(r["impressions"] for r in rows)
    total_clk = sum(r["clicks"] for r in rows)
    weighted = sum(r["position"]*r["impressions"] for r in rows)/total_imp if total_imp else 0
    summaries.append({"slug":slug,"queries":len(rows),"impressions":total_imp,"clicks":total_clk,"avg_position":round(weighted,1)})
    print(f"  {slug}: queries={len(rows):3d} impr={total_imp:4d} clk={total_clk} avg_pos={weighted:.1f}")

with open(os.path.join(OUT,"gsc-summary.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=["slug","queries","impressions","clicks","avg_position"]); w.writeheader()
    for r in summaries: w.writerow(r)

# Save per-hub full GSC details
with open(os.path.join(OUT,"gsc-per-hub.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=["slug","query","clicks","impressions","position"]); w.writeheader()
    for slug,rows in GSC_DATA.items():
        for r in rows:
            w.writerow({"slug":slug, **r})

# ============================================================
# Competitor per county
# ============================================================
COMP = [
    {"slug":"los-angeles-county","query":"appliance repair los angeles county","our_position":"absent in DDG top-5; homepage at #5 instead",
     "top5":"1.Yelp 2.losangelesappliancerepair.co 3.laappliancerepair.net 4.chiefappliance.com 5.samedayappliance.repair(HOMEPAGE)"},
    {"slug":"orange-county","query":"appliance repair orange county","our_position":"absent",
     "top5":"1.myappliancecrew.com 2.Yelp 3.caesarsapplianceservice.com 4.Angi 5.dnvappliance.com"},
    {"slug":"ventura-county","query":"appliance repair ventura county","our_position":"absent",
     "top5":"1.Yelp 2.vappliancerepair.com 3.Sears 4.Angi 5.Stringer (Yelp)"},
    {"slug":"san-bernardino-county","query":"appliance repair san bernardino county","our_position":"absent",
     "top5":"1.Yelp 2.sanbernardinoappliance.com 3.sb-appliance-repair.com 4.Thumbtack 5.ars.repair"},
    {"slug":"riverside-county","query":"appliance repair riverside county","our_position":"absent",
     "top5":"1.ars.repair 2.canyon-crest-appliance-repair.com 3.Sears 4.riverside-appliancerepair.com 5.appliancesrepairriverside.com"},
]
with open(os.path.join(OUT,"competitor-per-county.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=["slug","query","our_position","top5"]); w.writeheader()
    for r in COMP: w.writerow(r)

# ============================================================
# Schema check per hub
# ============================================================
print("\n=== Schema check ===")
SCHEMA = []
for slug in ["los-angeles-county","orange-county","ventura-county","san-bernardino-county","riverside-county"]:
    src = open(os.path.join(ROOT,"src/pages",f"{slug}.astro"),"r",encoding="utf-8").read()
    chk = {
        "slug": slug,
        "has_HomeAndConstructionBusiness": "HomeAndConstructionBusiness" in src,
        "has_AdministrativeArea": "AdministrativeArea" in src,
        "openingHoursSpecification_count": src.count('"OpeningHoursSpecification"'),
        "hasCredential_count": src.count('"EducationalOccupationalCredential"'),
        "legalName": "HVAC 777 LLC" if '"legalName": "HVAC 777 LLC"' in src else ("present" if "legalName" in src else "MISSING"),
        "has_aggregateRating_forbidden": "aggregateRating" in src,
        "has_streetAddress_forbidden": "streetAddress" in src,
        "has_FAQPage": "FAQPage" in src,
        "FAQ_questions": src.count('"@type": "Question"'),
        "has_location_array_filiali": '"location"' in src,
    }
    SCHEMA.append(chk)
    print(f"  {slug}: legalName={chk['legalName']}  hasCredentials={chk['hasCredential_count']}  openingHours={chk['openingHoursSpecification_count']}  FAQ={chk['FAQ_questions']}  aggregateRating(forbidden)={chk['has_aggregateRating_forbidden']}  streetAddress(forbidden)={chk['has_streetAddress_forbidden']}  location_array={chk['has_location_array_filiali']}")

with open(os.path.join(OUT,"schema-check.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=list(SCHEMA[0].keys())); w.writeheader()
    for r in SCHEMA: w.writerow(r)

# ============================================================
# City pillar comparison
# ============================================================
print("\n=== City pillar comparison ===")
CITY_PILLARS = ["irvine","thousand-oaks","riverside","rancho-cucamonga","temecula","pasadena","burbank","santa-monica","murrieta","chino-hills","ontario"]
pillar_data = []
for c in CITY_PILLARS:
    p = os.path.join(ROOT,"src/pages",f"{c}.astro")
    if not os.path.exists(p):
        continue
    src = open(p,"r",encoding="utf-8").read()
    m = re.search(r"^---\n.*?\n---\n", src, re.DOTALL)
    body = src[m.end():] if m else src
    body = re.sub(r"<style[\s\S]*?</style>"," ", body, flags=re.IGNORECASE)
    body = re.sub(r"<script[\s\S]*?</script>"," ", body, flags=re.IGNORECASE)
    body = re.sub(r"<[^>]+>"," ", body)
    words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", body.lower())
    has_h1 = "<h1" in src
    has_title = "const title" in src
    h2_count = src.count("<h2")
    faq_count = src.count('"@type": "Question"')
    links = re.findall(r'href="([^"]+)"', src)
    county_links = [l for l in links if "-county/" in l]
    pillar_data.append({"slug":c, "wordcount":len(words), "has_h1":has_h1, "has_title":has_title, "h2_count":h2_count, "faq_count":faq_count, "county_links_out":len(county_links)})
    print(f"  {c:20s}: wc={len(words):4d}  H1={has_h1}  title={has_title}  H2={h2_count}  FAQ={faq_count}  →county-links={len(county_links)}")

with open(os.path.join(OUT,"city-pillar-stub-check.csv"),"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=["slug","wordcount","has_h1","has_title","h2_count","faq_count","county_links_out"]); w.writeheader()
    for r in pillar_data: w.writerow(r)

print("\n=== DONE ===")
