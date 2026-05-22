#!/usr/bin/env python3
"""Fresh cannibalization audit — 7d post-cutover (2026-05-15..05-22).

Reads the saved mcp__gsc raw JSON output, extracts (query, page) rows,
applies the same intended-URL heuristic as commit 7dc06e0
(scripts/cannibalization-2026-05-22/02_cannibal_map.py), but with 7d
thresholds. Then diffs against the previous 14d cannibal-map.csv.
"""
import csv, json, re, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
RAW_SRC = Path(r"C:\Users\Roman\.claude\projects\C--Users-Roman\e0c5c7f2-20b1-4a06-a32a-37b5b6588a8b\tool-results\mcp-gsc-get_advanced_search_analytics-1779474613282.txt")
OUT_DIR = ROOT / "scripts/cannibalization-2026-05-22-fresh"
OUT_DIR.mkdir(parents=True, exist_ok=True)
GSC_CSV = OUT_DIR / "gsc-raw-7d.csv"
MAP_CSV = OUT_DIR / "cannibal-map-7d.csv"
DIFF_CSV = OUT_DIR / "diff-vs-14d.csv"

PREV_MAP = ROOT / "scripts/cannibalization-2026-05-22/cannibal-map.csv"

CITIES_TS = ROOT / "src/data/cities.ts"
SERVICES_TS = ROOT / "src/data/services.ts"
BRANDS_DIR = ROOT / "src/pages/brands"

# 7d window thresholds (per task spec).
IMP_MIN = 5  # filter floor
CRITICAL_IMP = 25  # 7-day threshold (was 50 for 14d)
HIGH_IMP_LO = 10
HIGH_IMP_HI = 25

# === Heuristic helpers — mirror 02_cannibal_map.py ===========================

SERVICE_TOKEN_MAP = {
    "refrigerator": "refrigerator-repair", "fridge": "refrigerator-repair",
    "freezer": "refrigerator-repair", "washer": "washer-repair",
    "washing machine": "washer-repair", "washing": "washer-repair",
    "dryer": "dryer-repair", "oven": "oven-repair", "stove": "oven-repair",
    "range": "oven-repair", "dishwasher": "dishwasher-repair",
    "microwave": "microwave-repair", "cooktop": "cooktop-repair",
    "wall oven": "wall-oven-repair", "range hood": "range-hood-repair",
    "ice maker": "ice-maker-repair", "wine cooler": "wine-cooler-repair",
    "wine cellar": "wine-cellar-cooling-repair",
    "garbage disposal": "garbage-disposal-repair",
    "dryer vent": "dryer-vent-repair",
    "trash compactor": "trash-compactor-repair",
}
SERVICE_TOKEN_KEYS = sorted(SERVICE_TOKEN_MAP, key=len, reverse=True)

OUTDOOR_TOKENS = {
    "grill": "outdoor/grill-repair", "bbq": "outdoor/grill-repair",
    "pizza oven": "outdoor/pizza-oven-repair",
    "patio heater": "outdoor/patio-heater-repair",
    "fireplace": "outdoor/fireplace-repair",
    "smoker": "outdoor/smoker-repair",
    "outdoor kitchen": "outdoor/outdoor-kitchen-repair",
    "outdoor refrigerator": "outdoor/outdoor-refrigerator-repair",
}
COMMERCIAL_TOKENS = {
    "walk-in cooler": "commercial/walk-in-cooler-repair",
    "walk in cooler": "commercial/walk-in-cooler-repair",
    "ice machine": "commercial/ice-machine-repair",
    "fryer": "commercial/fryer-repair",
    "combi oven": "commercial/combi-oven-repair",
    "steamer": "commercial/steamer-repair",
    "salamander": "commercial/salamander-repair",
    "exhaust hood": "commercial/exhaust-hood-repair",
    "vent hood": "commercial/exhaust-hood-repair",
}
PRICE_HINTS = ("cost", "price", "how much")
NEAR_ME_HINTS = ("near me", "nearby", "around me")
LA_SYNONYMS = {"los angeles", "la", "l.a.", "l a"}


def load_slugs():
    cities = {}
    text = CITIES_TS.read_text(encoding="utf-8")
    for m in re.finditer(r"slug:\s*'([a-z0-9-]+)'[\s\S]{0,300}?name:\s*'([^']+)'", text):
        cities[m.group(1)] = m.group(2)
    services = {}
    text = SERVICES_TS.read_text(encoding="utf-8")
    for m in re.finditer(r"slug:\s*'([a-z0-9-]+)'[\s\S]{0,300}?name:\s*'([^']+)'", text):
        services[m.group(1)] = m.group(2)
    brands = set()
    if BRANDS_DIR.exists():
        for p in BRANDS_DIR.glob("*.astro"):
            brands.add(p.stem)
        for p in BRANDS_DIR.glob("*/index.astro"):
            brands.add(p.parent.name)
    return cities, services, brands


def slug_for_city(q_lower, city_lookup):
    for slug, name in city_lookup.items():
        name_low = name.lower()
        if name_low in q_lower:
            return slug
        slug_phrase = slug.replace("-", " ")
        if slug_phrase != name_low and slug_phrase in q_lower:
            return slug
    if any(s in q_lower for s in LA_SYNONYMS):
        for tok in LA_SYNONYMS:
            if re.search(rf"\b{re.escape(tok)}\b", q_lower):
                return "los-angeles"
    return None


def service_for_query(q_lower):
    for tok in SERVICE_TOKEN_KEYS:
        if re.search(rf"\b{re.escape(tok)}\b", q_lower):
            return SERVICE_TOKEN_MAP[tok]
    return None


def outdoor_for_query(q_lower):
    for tok, path in OUTDOOR_TOKENS.items():
        if tok in q_lower:
            return path
    return None


def commercial_for_query(q_lower):
    for tok, path in COMMERCIAL_TOKENS.items():
        if tok in q_lower:
            return path
    return None


def brand_for_query(q_lower, brands):
    for slug in sorted(brands, key=len, reverse=True):
        phrase = slug.replace("-", " ")
        if re.search(rf"\b{re.escape(phrase)}\b", q_lower):
            return slug
    return None


def intended_url(q, city_lookup, brands):
    q_lower = q.lower().strip()
    is_commercial = "commercial" in q_lower
    has_price = any(h in q_lower for h in PRICE_HINTS)
    has_near = any(h in q_lower for h in NEAR_ME_HINTS)
    city_slug = slug_for_city(q_lower, city_lookup)
    brand = brand_for_query(q_lower, brands)
    service_slug = service_for_query(q_lower)

    out = outdoor_for_query(q_lower)
    if out:
        return f"/{out}/"
    com = commercial_for_query(q_lower)
    if com:
        return f"/{com}/"
    if is_commercial and service_slug:
        appliance = service_slug.replace("-repair", "")
        return f"/commercial/{appliance}-repair/"
    if has_price and service_slug:
        appliance = service_slug.replace("-repair", "")
        # special: commercial vent/exhaust hood cost = price-list/commercial-exhaust-hood-repair-cost
        if is_commercial:
            return f"/price-list/commercial-{appliance}-repair-cost/"
        return f"/price-list/{appliance}-repair-cost/"
    if brand and service_slug:
        appliance = service_slug.replace("-repair", "")
        return f"/brands/{brand}-{appliance}-repair/"
    if brand and not service_slug:
        return f"/brands/{brand}/"
    if city_slug and service_slug:
        return f"/{city_slug}/{service_slug}/"
    if city_slug and ("appliance" in q_lower or "repair" in q_lower):
        return f"/{city_slug}/"
    if service_slug:
        return f"/services/{service_slug}/"
    if "same day" in q_lower and "appliance" in q_lower:
        return "/"
    if has_near and "appliance" in q_lower:
        return "/"
    if "appliance" in q_lower or "repair" in q_lower:
        return "/"
    return "/"


def url_to_path(u):
    if not u:
        return u
    m = re.match(r"https?://[^/]+(/.*)?", u)
    if m:
        return m.group(1) or "/"
    return u


# === Step 1: parse raw GSC ====================================================
print(f"[*] Reading: {RAW_SRC}", file=sys.stderr)
raw_outer = RAW_SRC.read_text(encoding="utf-8")
# format: {"result": "<json string>"}
outer = json.loads(raw_outer)
inner_str = outer["result"]
inner = json.loads(inner_str)
rows_raw = inner.get("rows", [])
print(f"[*] Raw rows: {len(rows_raw)}", file=sys.stderr)

# Save gsc-raw-7d.csv (filter imp >= IMP_MIN)
# Row format already flattened: {query, page, clicks, impressions, ctr, position}
csv_rows = []
for r in rows_raw:
    imp = int(r.get("impressions", 0))
    if imp < IMP_MIN:
        continue
    csv_rows.append({
        "query": r.get("query", ""),
        "page": r.get("page", ""),
        "clicks": int(r.get("clicks", 0)),
        "impressions": imp,
        "ctr": float(r.get("ctr", 0)),
        "position": float(r.get("position", 0)),
    })

with GSC_CSV.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["query","page","clicks","impressions","ctr","position"])
    w.writeheader()
    for r in csv_rows: w.writerow(r)
print(f"[*] Filtered rows (imp>={IMP_MIN}): {len(csv_rows)} → {GSC_CSV}", file=sys.stderr)

total_imp_all = sum(r["impressions"] for r in csv_rows)
total_clk_all = sum(r["clicks"] for r in csv_rows)
print(f"[*] Total impressions: {total_imp_all}, total clicks: {total_clk_all}", file=sys.stderr)

# === Step 2: build cannibal map ===============================================
city_lookup, service_lookup, brand_slugs = load_slugs()
print(f"[*] cities: {len(city_lookup)} | services: {len(service_lookup)} | brands: {len(brand_slugs)}", file=sys.stderr)

grouped = defaultdict(list)
for r in csv_rows:
    grouped[r["query"].lower().strip()].append({
        "query": r["query"], "page": url_to_path(r["page"]),
        "clicks": r["clicks"], "impressions": r["impressions"],
        "position": r["position"], "ctr": r["ctr"],
    })

cases = []
for q_lower, rows in grouped.items():
    rows_sorted = sorted(rows, key=lambda x: x["impressions"], reverse=True)
    winner = rows_sorted[0]
    num_urls = len(rows_sorted)
    total_imp = sum(r["impressions"] for r in rows_sorted)
    total_clk = sum(r["clicks"] for r in rows_sorted)
    avg_pos = sum(r["position"] * r["impressions"] for r in rows_sorted) / total_imp if total_imp else winner["position"]
    q_display = rows_sorted[0]["query"]
    urls_field = "|".join(
        f"{r['page']}::imp={r['impressions']}::pos={r['position']:.1f}::clk={r['clicks']}"
        for r in rows_sorted[:5]
    )
    intended = intended_url(q_display, city_lookup, brand_slugs)
    actual = winner["page"]
    is_mis = intended != actual
    intended_imp = sum(r["impressions"] for r in rows_sorted if r["page"] == intended)
    winner_imp = winner["impressions"]
    ratio = intended_imp / winner_imp if winner_imp else 1.0

    if is_mis and total_imp >= CRITICAL_IMP and ratio < 0.5:
        sev = "CRITICAL"
    elif is_mis and HIGH_IMP_LO <= total_imp < CRITICAL_IMP:
        sev = "HIGH"
    elif is_mis and total_imp >= CRITICAL_IMP and ratio >= 0.5:
        sev = "HIGH"
    elif not is_mis and num_urls > 1 and total_imp >= HIGH_IMP_LO:
        sev = "MEDIUM"
    else:
        sev = "LOW"

    cases.append({
        "severity": sev, "query": q_display, "num_urls": num_urls,
        "total_impressions": total_imp, "total_clicks": total_clk,
        "avg_position": round(avg_pos, 2),
        "intended_url": intended, "actual_winner": actual,
        "is_misaligned": is_mis,
        "intended_imp": intended_imp, "winner_imp": winner_imp,
        "urls": urls_field,
    })

cases.sort(key=lambda c: (-c["total_impressions"], c["query"]))

with MAP_CSV.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(cases[0].keys()))
    w.writeheader()
    for c in cases: w.writerow(c)
print(f"[*] Cannibal map → {MAP_CSV}", file=sys.stderr)

# Severity summary
by_sev_count = defaultdict(int); by_sev_imp = defaultdict(int)
for c in cases:
    by_sev_count[c["severity"]] += 1
    by_sev_imp[c["severity"]] += c["total_impressions"]
print("\n[*] SEVERITY SUMMARY (7d, 2026-05-15..05-22):", file=sys.stderr)
for k in ("CRITICAL","HIGH","MEDIUM","LOW"):
    print(f"  {k:8s}  {by_sev_count[k]:4d} cases  {by_sev_imp[k]:6d} imps", file=sys.stderr)

# === Step 3: diff vs 14d ======================================================
prev = {}
if PREV_MAP.exists():
    with PREV_MAP.open(encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            prev[row["query"].lower().strip()] = row
    print(f"\n[*] Loaded previous 14d map: {len(prev)} queries", file=sys.stderr)
else:
    print(f"[!] Previous map not found: {PREV_MAP}", file=sys.stderr)

# Build current map for diff
curr = {c["query"].lower().strip(): c for c in cases}

diff_rows = []
prev_critical_queries = {q for q, r in prev.items() if r.get("severity") == "CRITICAL"}
prev_high_queries = {q for q, r in prev.items() if r.get("severity") == "HIGH"}

for q in prev_critical_queries | prev_high_queries:
    p = prev[q]
    c = curr.get(q)
    if not c:
        status = "VANISHED"
        diff_rows.append({"status": status, "query": p["query"], "prev_severity": p["severity"],
                          "prev_imp": p["total_impressions"], "curr_severity": "—",
                          "curr_imp": 0, "winner_now": "—", "intended": p["intended_url"]})
        continue
    if c["severity"] == "CRITICAL":
        status = "PERSISTS" if p["severity"] == "CRITICAL" else "WORSENED"
    elif c["severity"] == "HIGH":
        status = "HIGH_NOW" if p["severity"] == "CRITICAL" else "PERSISTS"
    elif c["severity"] in ("MEDIUM","LOW"):
        status = "RESOLVED"
    else:
        status = "UNKNOWN"
    diff_rows.append({"status": status, "query": c["query"], "prev_severity": p["severity"],
                      "prev_imp": p["total_impressions"], "curr_severity": c["severity"],
                      "curr_imp": c["total_impressions"], "winner_now": c["actual_winner"],
                      "intended": c["intended_url"]})

# NEW = current CRITICAL or HIGH that wasn't in prev critical+high pool
for q, c in curr.items():
    if c["severity"] in ("CRITICAL","HIGH") and q not in (prev_critical_queries | prev_high_queries):
        diff_rows.append({"status": "NEW", "query": c["query"], "prev_severity": "—",
                          "prev_imp": 0, "curr_severity": c["severity"],
                          "curr_imp": c["total_impressions"], "winner_now": c["actual_winner"],
                          "intended": c["intended_url"]})

diff_rows.sort(key=lambda x: (-(int(x["curr_imp"]) if x["curr_imp"] else 0), x["query"]))
with DIFF_CSV.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(diff_rows[0].keys()))
    w.writeheader()
    for r in diff_rows: w.writerow(r)
print(f"\n[*] Diff vs 14d → {DIFF_CSV}", file=sys.stderr)

# Diff summary
by_status = defaultdict(int); by_status_imp_curr = defaultdict(int)
for r in diff_rows:
    by_status[r["status"]] += 1
    try: by_status_imp_curr[r["status"]] += int(r["curr_imp"])
    except: pass
print(f"\n[*] DIFF SUMMARY:", file=sys.stderr)
for k in ("RESOLVED","VANISHED","PERSISTS","WORSENED","HIGH_NOW","NEW"):
    print(f"  {k:11s}  {by_status[k]:4d} cases  curr_imp={by_status_imp_curr[k]:5d}", file=sys.stderr)

# === Top 20 actual CRITICAL ===================================================
print(f"\n[*] TOP 20 CRITICAL cases (7d data, by impressions):", file=sys.stderr)
crit = [c for c in cases if c["severity"] == "CRITICAL"]
for i, c in enumerate(crit[:20], 1):
    print(f"  {i:2d}. {c['query']!r:55s} | {c['num_urls']} URLs | imp={c['total_impressions']:4d} | pos={c['avg_position']:5.1f} | winner={c['actual_winner']!r}", file=sys.stderr)
    if c['intended_url'] != c['actual_winner']:
        print(f"      intended={c['intended_url']!r}", file=sys.stderr)

# === Hub dominance ============================================================
HUBS = ["/west-hollywood/","/los-angeles/","/pasadena/","/thousand-oaks/","/beverly-hills/","/"]
print(f"\n[*] HUB DOMINANCE (7d):", file=sys.stderr)
for hub in HUBS:
    hub_wins = [c for c in cases if c["actual_winner"] == hub]
    # Sub-filter: winner == hub AND query contains another city name OR is generic
    hub_steals = []
    for c in hub_wins:
        if c["is_misaligned"]:
            hub_steals.append(c)
    print(f"  {hub:25s} : total wins={len(hub_wins):3d}, steals={len(hub_steals):3d}, steal_imp={sum(c['total_impressions'] for c in hub_steals):4d}", file=sys.stderr)

print("\n[*] DONE", file=sys.stderr)
