"""Build cannibalization map from gsc-raw.csv.

Aggregates by (lower-cased) query, derives intended_url via heuristics that
match the actual URL conventions in this project (city pillars, services,
brands, commercial, outdoor, etc.), and labels severity per the wave's
14-day-window thresholds.
"""
from __future__ import annotations

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
IN_CSV = ROOT / "scripts/cannibalization-2026-05-22/gsc-raw.csv"
OUT_CSV = ROOT / "scripts/cannibalization-2026-05-22/cannibal-map.csv"

CITIES_TS = ROOT / "src/data/cities.ts"
SERVICES_TS = ROOT / "src/data/services.ts"
BRANDS_DIR = ROOT / "src/pages/brands"

# Severity thresholds — 14-day window.
CANNIBAL_IMP_MIN = 20  # min total imps to be considered a cannibal case
CRITICAL_IMP = 50
HIGH_IMP_LO = 20
HIGH_IMP_HI = 50


def load_slugs() -> tuple[dict[str, str], dict[str, str], set[str]]:
    """Return (city_slug→name), (service_slug→name), brand_slugs set."""
    cities: dict[str, str] = {}
    text = CITIES_TS.read_text(encoding="utf-8")
    for m in re.finditer(r"slug:\s*'([a-z0-9-]+)'[\s\S]{0,300}?name:\s*'([^']+)'", text):
        cities[m.group(1)] = m.group(2)

    services: dict[str, str] = {}
    text = SERVICES_TS.read_text(encoding="utf-8")
    for m in re.finditer(r"slug:\s*'([a-z0-9-]+)'[\s\S]{0,300}?name:\s*'([^']+)'", text):
        services[m.group(1)] = m.group(2)

    brands: set[str] = set()
    if BRANDS_DIR.exists():
        for p in BRANDS_DIR.glob("*.astro"):
            brands.add(p.stem)
        # also brands/<slug>/index.astro if any
        for p in BRANDS_DIR.glob("*/index.astro"):
            brands.add(p.parent.name)
    return cities, services, brands


# ----- Query → service-slug helpers ---------------------------------------

# Map service-token words → service slug. Mirror src/data/services.ts.
SERVICE_TOKEN_MAP = {
    "refrigerator": "refrigerator-repair",
    "fridge": "refrigerator-repair",
    "freezer": "refrigerator-repair",
    "washer": "washer-repair",
    "washing machine": "washer-repair",
    "washing": "washer-repair",
    "dryer": "dryer-repair",
    "oven": "oven-repair",
    "stove": "oven-repair",
    "range": "oven-repair",
    "dishwasher": "dishwasher-repair",
    "microwave": "microwave-repair",
    "cooktop": "cooktop-repair",
    "wall oven": "wall-oven-repair",
    "range hood": "range-hood-repair",
    "ice maker": "ice-maker-repair",
    "wine cooler": "wine-cooler-repair",
    "wine cellar": "wine-cellar-cooling-repair",
    "garbage disposal": "garbage-disposal-repair",
    "dryer vent": "dryer-vent-repair",
    "trash compactor": "trash-compactor-repair",
}

# Order matters — longer phrases first.
SERVICE_TOKEN_KEYS = sorted(SERVICE_TOKEN_MAP, key=len, reverse=True)

# Outdoor / commercial signals.
OUTDOOR_TOKENS = {
    "grill": "outdoor/grill-repair",
    "bbq": "outdoor/grill-repair",
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
}

PRICE_HINTS = ("cost", "price", "how much")
NEAR_ME_HINTS = ("near me", "nearby", "around me")

# LA-style geographic terms that map to /los-angeles/ city pillar (not generic LA fallback).
LA_SYNONYMS = {"los angeles", "la", "l.a.", "l a"}


def slug_for_city(q_lower: str, city_lookup: dict[str, str]) -> str | None:
    """Return city slug if q mentions one of the 89 cities (or LA aliases)."""
    for slug, name in city_lookup.items():
        name_low = name.lower()
        if name_low in q_lower:
            return slug
        # also try slug with dashes converted to spaces (e.g. "west hollywood")
        slug_phrase = slug.replace("-", " ")
        if slug_phrase != name_low and slug_phrase in q_lower:
            return slug
    if any(s in q_lower for s in LA_SYNONYMS):
        # Only count as LA if the LA token is a *word* boundary, not "blah"
        for tok in LA_SYNONYMS:
            if re.search(rf"\b{re.escape(tok)}\b", q_lower):
                return "los-angeles"
    return None


def service_for_query(q_lower: str) -> str | None:
    """Return /services/<slug>/ path if a service keyword is detected."""
    for tok in SERVICE_TOKEN_KEYS:
        if re.search(rf"\b{re.escape(tok)}\b", q_lower):
            return SERVICE_TOKEN_MAP[tok]
    return None


def outdoor_for_query(q_lower: str) -> str | None:
    for tok, path in OUTDOOR_TOKENS.items():
        if tok in q_lower:
            return path
    return None


def commercial_for_query(q_lower: str) -> str | None:
    for tok, path in COMMERCIAL_TOKENS.items():
        if tok in q_lower:
            return path
    return None


def brand_for_query(q_lower: str, brands: set[str]) -> str | None:
    """Return brand slug if query starts with / contains a brand token."""
    for slug in sorted(brands, key=len, reverse=True):
        # brand-tokens are slugs like 'sub-zero', 'ge-cafe' — accept both space-and-dash form
        phrase = slug.replace("-", " ")
        if re.search(rf"\b{re.escape(phrase)}\b", q_lower):
            return slug
    return None


def intended_url(q: str, city_lookup: dict[str, str], brands: set[str]) -> str:
    q_lower = q.lower().strip()
    is_commercial = "commercial" in q_lower
    has_price = any(h in q_lower for h in PRICE_HINTS)
    has_near = any(h in q_lower for h in NEAR_ME_HINTS)
    city_slug = slug_for_city(q_lower, city_lookup)
    brand = brand_for_query(q_lower, brands)
    service_slug = service_for_query(q_lower)

    # Outdoor / commercial pillars (specific equipment).
    out = outdoor_for_query(q_lower)
    if out:
        return f"/{out}/"
    com = commercial_for_query(q_lower)
    if com:
        return f"/{com}/"
    if is_commercial and service_slug:
        # commercial X repair → /commercial/<x>-repair/
        appliance = service_slug.replace("-repair", "")
        return f"/commercial/{appliance}-repair/"

    # Price-list family.
    if has_price and service_slug:
        appliance = service_slug.replace("-repair", "")
        return f"/price-list/{appliance}-repair-cost/"

    # Brand × service combos.
    if brand and service_slug:
        appliance = service_slug.replace("-repair", "")
        return f"/brands/{brand}-{appliance}-repair/"

    # Brand pillar (no service noun).
    if brand and not service_slug:
        return f"/brands/{brand}/"

    # city × service combo.
    if city_slug and service_slug:
        return f"/{city_slug}/{service_slug}/"

    # city only (e.g. "appliance repair beverly hills").
    if city_slug and ("appliance" in q_lower or "repair" in q_lower):
        return f"/{city_slug}/"

    # service-only (no city) → service hub (LA bias).
    if service_slug:
        return f"/services/{service_slug}/"

    # "same day appliance repair", "appliance repair near me" — homepage.
    if "same day" in q_lower and "appliance" in q_lower:
        return "/"
    if has_near and "appliance" in q_lower:
        return "/"

    # Default — homepage for ambiguous root-intent queries.
    if "appliance" in q_lower or "repair" in q_lower:
        return "/"
    return "/"  # last resort


# ----- Normalization helpers ----------------------------------------------


def url_to_path(u: str) -> str:
    """Strip protocol+host to path."""
    if not u:
        return u
    m = re.match(r"https?://[^/]+(/.*)?", u)
    if m:
        return m.group(1) or "/"
    return u


def severity(case: dict, intended_winner_imp_ratio: float) -> str:
    if case["is_misaligned"] and case["total_impressions"] >= CRITICAL_IMP and intended_winner_imp_ratio < 0.5:
        return "CRITICAL"
    if case["is_misaligned"] and HIGH_IMP_LO <= case["total_impressions"] < CRITICAL_IMP:
        return "HIGH"
    if case["is_misaligned"] and case["total_impressions"] >= CRITICAL_IMP and intended_winner_imp_ratio >= 0.5:
        return "HIGH"
    if not case["is_misaligned"] and case["num_urls"] > 1 and case["total_impressions"] >= HIGH_IMP_LO:
        return "MEDIUM"
    return "LOW"


def main() -> int:
    city_lookup, service_lookup, brand_slugs = load_slugs()
    print(f"cities: {len(city_lookup)}  services: {len(service_lookup)}  brands: {len(brand_slugs)}", file=sys.stderr)

    # group by lowercased query.
    grouped: dict[str, list[dict]] = defaultdict(list)
    with IN_CSV.open(encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            q = row["query"].strip()
            grouped[q.lower()].append(
                {
                    "query": q,
                    "page": url_to_path(row["page"]),
                    "clicks": int(row["clicks"]),
                    "impressions": int(row["impressions"]),
                    "position": float(row["position"]),
                    "ctr": float(row["ctr"]),
                }
            )

    print(f"unique queries: {len(grouped)}", file=sys.stderr)

    cases: list[dict] = []
    for q_lower, rows in grouped.items():
        # Sort URLs by impressions desc.
        rows_sorted = sorted(rows, key=lambda x: x["impressions"], reverse=True)
        winner = rows_sorted[0]
        num_urls = len(rows_sorted)
        total_imp = sum(r["impressions"] for r in rows_sorted)
        total_clk = sum(r["clicks"] for r in rows_sorted)
        # Imp-weighted avg position.
        if total_imp:
            avg_pos = sum(r["position"] * r["impressions"] for r in rows_sorted) / total_imp
        else:
            avg_pos = winner["position"]
        # Use first-seen original casing.
        q_display = rows_sorted[0]["query"]
        # Compose urls field: top 5 by imps.
        urls_field = "|".join(
            f"{r['page']}::imp={r['impressions']}::pos={r['position']:.1f}::clk={r['clicks']}"
            for r in rows_sorted[:5]
        )
        intended = intended_url(q_display, city_lookup, brand_slugs)
        actual = winner["page"]
        is_mis = intended != actual

        # Compute "rightful imps" — sum of imps that DID land on intended.
        intended_imp = sum(r["impressions"] for r in rows_sorted if r["page"] == intended)
        # ratio of actual-winner imps the intended URL "should be getting".
        # Goal: if intended URL exists in ranking pool but is dwarfed, ratio < 0.5.
        winner_imp = winner["impressions"]
        intended_winner_ratio = intended_imp / winner_imp if winner_imp else 1.0

        case = {
            "query": q_display,
            "num_urls": num_urls,
            "total_impressions": total_imp,
            "total_clicks": total_clk,
            "avg_position": round(avg_pos, 2),
            "urls": urls_field,
            "intended_url": intended,
            "actual_winner": actual,
            "is_misaligned": is_mis,
            "intended_imp": intended_imp,
            "winner_imp": winner_imp,
        }
        case["severity"] = severity(case, intended_winner_ratio)
        cases.append(case)

    cases.sort(key=lambda c: (-c["total_impressions"], c["query"]))

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "severity", "query", "num_urls", "total_impressions", "total_clicks", "avg_position",
                "intended_url", "actual_winner", "is_misaligned", "intended_imp", "winner_imp", "urls",
            ]
        )
        for c in cases:
            w.writerow(
                [
                    c["severity"], c["query"], c["num_urls"], c["total_impressions"], c["total_clicks"],
                    c["avg_position"], c["intended_url"], c["actual_winner"], c["is_misaligned"],
                    c["intended_imp"], c["winner_imp"], c["urls"],
                ]
            )
    print(f"wrote {OUT_CSV}", file=sys.stderr)

    # Print summary.
    by_sev: dict[str, int] = defaultdict(int)
    by_sev_imp: dict[str, int] = defaultdict(int)
    for c in cases:
        by_sev[c["severity"]] += 1
        by_sev_imp[c["severity"]] += c["total_impressions"]
    print("severity summary:", file=sys.stderr)
    for k in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
        print(f"  {k:8s}  {by_sev[k]:5d} cases  {by_sev_imp[k]:6d} imps", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
