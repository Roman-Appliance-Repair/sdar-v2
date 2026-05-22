#!/usr/bin/env python3
"""Filter top candidates for CTR-focused title/meta rewrite sweep.

Criteria:
- pos 5-15
- imp >= 20 (7d window)
- clicks 0-1
- single winner URL (no cannibalization)
- winner has corresponding .astro source
- NOT a city pillar (87 cities — separate GMB channel)
- NOT homepage (/)

Input: scripts/cannibalization-2026-05-22-fresh/gsc-raw-7d.csv
Output: scripts/ctr-sweep-2026-05-22/{candidates-top20.csv, audit-per-url.csv}
"""
import csv, re
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
IN_CSV = ROOT / "scripts/cannibalization-2026-05-22-fresh/gsc-raw-7d.csv"
OUT_DIR = ROOT / "scripts/ctr-sweep-2026-05-22"
OUT_DIR.mkdir(parents=True, exist_ok=True)
CANDIDATES_CSV = OUT_DIR / "candidates-top20.csv"
AUDIT_CSV = OUT_DIR / "audit-per-url.csv"

# Load 87 city slugs to exclude
CITIES_TS = ROOT / "src/data/cities.ts"
city_slugs = set()
for m in re.finditer(r"slug:\s*'([a-z0-9-]+)'", CITIES_TS.read_text(encoding="utf-8")):
    city_slugs.add(m.group(1))
print(f"[*] Loaded {len(city_slugs)} city slugs (excluded from candidates)")


def url_to_path(u):
    m = re.match(r"https?://[^/]+(/.*)?", u)
    if m: return m.group(1) or "/"
    return u


def is_city_pillar(path):
    """True if path is /<city-slug>/ for one of the 87 cities (exact match)."""
    if not path.startswith("/") or not path.endswith("/"):
        return False
    slug = path.strip("/")
    return slug in city_slugs


def astro_source_path(url_path):
    """Map URL path → src/pages/.astro source file. Returns Path or None."""
    p = url_path.strip("/")
    candidates = [
        ROOT / "src/pages" / (p + ".astro"),
        ROOT / "src/pages" / p / "index.astro",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


# ============================================================
# STEP 1: load + filter raw
# ============================================================
all_rows = []
with IN_CSV.open(encoding="utf-8") as f:
    r = csv.DictReader(f)
    for row in r:
        all_rows.append({
            "query": row["query"],
            "page": url_to_path(row["page"]),
            "clicks": int(row["clicks"]),
            "impressions": int(row["impressions"]),
            "ctr": float(row["ctr"]),
            "position": float(row["position"]),
        })
print(f"[*] Raw rows: {len(all_rows)}")

# imp >= 20 filter
rows = [r for r in all_rows if r["impressions"] >= 20]
print(f"[*] After imp>=20: {len(rows)}")

# ============================================================
# STEP 2: group by query, find single-winner queries
# ============================================================
by_query = defaultdict(list)
for r in rows:
    by_query[r["query"].lower().strip()].append(r)

candidates = []
for q_lower, q_rows in by_query.items():
    # Use top-impr row as candidate (in case the query has multiple URLs, pick the winner)
    q_rows.sort(key=lambda x: -x["impressions"])
    winner = q_rows[0]

    # Filter: pos 5-15
    if not (5 <= winner["position"] <= 15):
        continue
    # Filter: clicks 0-1
    if winner["clicks"] > 1:
        continue
    # Filter: imp >= 20 (already on winner)
    if winner["impressions"] < 20:
        continue
    # Filter: single winner — top URL has >=60% of total imp for this query
    total_q_imp = sum(r["impressions"] for r in q_rows)
    if winner["impressions"] / total_q_imp < 0.60:
        continue
    # Filter: not city pillar, not homepage
    page = winner["page"]
    if page == "/":
        continue
    if is_city_pillar(page):
        continue
    # Filter: has .astro source
    src = astro_source_path(page)
    if not src:
        continue

    candidates.append({
        "query": winner["query"],
        "page": page,
        "src_file": str(src.relative_to(ROOT)).replace("\\", "/"),
        "impressions": winner["impressions"],
        "clicks": winner["clicks"],
        "position": round(winner["position"], 2),
        "ctr": round(winner["ctr"], 4),
        "num_urls_for_query": len(q_rows),
        "winner_share": round(winner["impressions"] / total_q_imp, 2),
    })

candidates.sort(key=lambda c: -c["impressions"])
print(f"[*] Candidates after all filters: {len(candidates)}")
candidates = candidates[:20]
print(f"[*] Top 20 → {CANDIDATES_CSV.name}")

with CANDIDATES_CSV.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(candidates[0].keys()))
    w.writeheader()
    for c in candidates: w.writerow(c)

# Print
print(f"\n{'#':>2}  {'imp':>4}  {'clk':>3}  {'pos':>5}  {'page':<60}  query")
for i, c in enumerate(candidates, 1):
    print(f"{i:>2}. {c['impressions']:>4}  {c['clicks']:>3}  {c['position']:>5}  {c['page']:<60}  {c['query'][:55]}")

# ============================================================
# STEP 3: audit each — extract current title + meta, body wc
# ============================================================
print(f"\n[*] STEP 3: auditing per-URL current titles/metas...")
audit_rows = []
for c in candidates:
    src = ROOT / c["src_file"]
    text = src.read_text(encoding="utf-8")

    # Extract const title = "..."
    m = re.search(r'const\s+title\s*=\s*"([^"]*)"', text)
    if not m:
        m = re.search(r"const\s+title\s*=\s*'([^']*)'", text)
    if not m:
        # Fallback: find <title>...</title>
        m = re.search(r'<title[^>]*>([^<]+)</title>', text)
    current_title = m.group(1) if m else "(no const title found)"
    title_pattern_quote = None
    title_full_line = None
    if m:
        title_full_line = m.group(0)
        # Detect single vs double quote
        if "'" in m.group(0) and 'const' in m.group(0):
            title_pattern_quote = "'"
        elif '"' in m.group(0):
            title_pattern_quote = '"'

    # Meta description — try const description = ...
    m2 = re.search(r'const\s+description\s*=\s*"([^"]*)"', text)
    if not m2:
        m2 = re.search(r"const\s+description\s*=\s*'([^']*)'", text)
    current_meta = m2.group(1) if m2 else "(no const description found)"

    # Body word count (rough — strip frontmatter/style/script/tags)
    body = re.sub(r"^---\n.*?\n---\n", "", text, count=1, flags=re.DOTALL)
    body = re.sub(r"<style[\s\S]*?</style>", " ", body, flags=re.IGNORECASE)
    body = re.sub(r"<script[\s\S]*?</script>", " ", body, flags=re.IGNORECASE)
    body = re.sub(r"<[^>]+>", " ", body)
    words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", body.lower())

    # Heuristic: does title contain the exact query keyword?
    q_lower = c["query"].lower()
    title_lower = current_title.lower()
    # Try contains, also try by 2-word phrases
    contains_query = q_lower in title_lower
    # Tokens
    q_tokens = re.findall(r"[a-z0-9]+", q_lower)
    t_tokens = set(re.findall(r"[a-z0-9]+", title_lower))
    token_match = sum(1 for t in q_tokens if t in t_tokens) / max(1, len(q_tokens))

    # Weakness flags
    flags = []
    if len(current_title) > 60:
        flags.append("title>60ch")
    if len(current_title) < 30:
        flags.append("title<30ch")
    if not contains_query and token_match < 0.6:
        flags.append("title_missing_query_keywords")
    if len(current_meta) > 160:
        flags.append("meta>160ch")
    if len(current_meta) < 90:
        flags.append("meta<90ch")
    if "$" not in current_meta and "$" not in current_title:
        flags.append("no_price_signal")
    if not any(w in (current_title + current_meta).lower() for w in ["same day", "fast", "today", "24"]):
        flags.append("no_speed_signal")
    if "los angeles" not in (current_title + current_meta).lower() and " la " not in (current_title + current_meta).lower() and " la|" not in (current_title + current_meta).lower():
        # check if query has geo
        if not any(g in q_lower for g in ["los angeles", "la ", "near me"]):
            pass  # no geo concern
        else:
            flags.append("no_geo_match")

    audit_rows.append({
        "rank": len(audit_rows) + 1,
        "query": c["query"],
        "page": c["page"],
        "src_file": c["src_file"],
        "impressions": c["impressions"],
        "clicks": c["clicks"],
        "position": c["position"],
        "current_title": current_title,
        "title_len": len(current_title),
        "current_meta": current_meta,
        "meta_len": len(current_meta),
        "body_wc": len(words),
        "title_contains_query": contains_query,
        "title_token_match_pct": round(token_match, 2),
        "weakness_flags": "; ".join(flags) if flags else "(none)",
    })

with AUDIT_CSV.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(audit_rows[0].keys()))
    w.writeheader()
    for r in audit_rows: w.writerow(r)
print(f"[*] Audit → {AUDIT_CSV.name}\n")

print(f"=== AUDIT SUMMARY ===\n")
for r in audit_rows:
    print(f"#{r['rank']:>2} | imp={r['impressions']:>3} pos={r['position']:>5} | {r['page']}")
    print(f"     query  : {r['query']!r}")
    print(f"     title  ({r['title_len']:>3}): {r['current_title']!r}")
    print(f"     meta   ({r['meta_len']:>3}): {r['current_meta'][:120]!r}{'...' if r['meta_len']>120 else ''}")
    print(f"     flags  : {r['weakness_flags']}")
    print()
