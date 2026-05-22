"""STEPS 5-7: deep dive top 20 + site-wide anchor audit + hub dominance.

Outputs:
  scripts/cannibalization-2026-05-22/top20-deep-dive.csv
  scripts/cannibalization-2026-05-22/all-internal-links.csv
  scripts/cannibalization-2026-05-22/hub-dominance.csv

All reads are read-only on src/.
"""
from __future__ import annotations

import csv
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
ART = ROOT / "scripts/cannibalization-2026-05-22"

CANN_CSV = ART / "cannibal-map.csv"
TOP20_OUT = ART / "top20-deep-dive.csv"
LINKS_OUT = ART / "all-internal-links.csv"
HUB_OUT = ART / "hub-dominance.csv"

SRC = ROOT / "src"
PAGES = SRC / "pages"

HUB_CITIES = {"los-angeles", "west-hollywood", "thousand-oaks", "pasadena", "beverly-hills"}

# Astro pages are .astro; consider md/mdx too.
SRC_GLOB_EXTS = (".astro", ".mdx", ".md", ".ts", ".tsx")


def iter_src_files():
    for p in SRC.rglob("*"):
        if not p.is_file() or p.suffix not in SRC_GLOB_EXTS:
            continue
        yield p


# ---------------------------------------------------------------------------
# STEP 6 — global anchor / internal-link audit.
# ---------------------------------------------------------------------------

# Capture <a ... href="..."> ... </a> and Astro <a ... href={`...`}>...</a>.
# Internal links: starting with /, or with samedayappliance.repair host.
LINK_RE = re.compile(
    r"""<a\b
        (?P<attrs>[^>]*?)
        \shref=(?P<quote>["'`])(?P<href>[^"'`]+)(?P=quote)
        (?P<rest>[^>]*?)>
        (?P<inner>.*?)
        </a>""",
    re.IGNORECASE | re.DOTALL | re.VERBOSE,
)

# Strip HTML tags from anchor inner text.
TAG_STRIP = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")
HOST_RE = re.compile(r"^https?://(?:www\.)?samedayappliance\.repair", re.I)


def normalize_internal(href: str) -> str | None:
    href = href.strip()
    if HOST_RE.match(href):
        href = HOST_RE.sub("", href)
    # template-literal artifacts (`${...}` not yet resolved) — skip
    if "${" in href:
        return None
    if href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
        return None
    if href.startswith("/") and not href.startswith("//"):
        # collapse trailing /index.astro etc. (rare)
        if not href.endswith("/") and "." not in href.rsplit("/", 1)[-1]:
            href = href + "/"
        return href
    return None


def crawl_links() -> list[dict]:
    rows = []
    for p in iter_src_files():
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for m in LINK_RE.finditer(text):
            href = normalize_internal(m.group("href"))
            if not href:
                continue
            inner = m.group("inner") or ""
            anchor = WS.sub(" ", TAG_STRIP.sub("", inner)).strip()
            if not anchor:
                anchor = "(no-text)"
            # truncate anchor for CSV sanity
            if len(anchor) > 120:
                anchor = anchor[:117] + "..."
            rows.append({"source_file": str(p.relative_to(ROOT)).replace("\\", "/"), "target": href, "anchor": anchor})
    return rows


# ---------------------------------------------------------------------------
# Quick lookup: number of internal in-links to a target path.
# ---------------------------------------------------------------------------

def build_target_index(link_rows: list[dict]):
    by_target: dict[str, Counter] = defaultdict(Counter)  # target → Counter(anchor)
    by_target_files: dict[str, set] = defaultdict(set)
    for r in link_rows:
        by_target[r["target"]][r["anchor"].lower()] += 1
        by_target_files[r["target"]].add(r["source_file"])
    return by_target, by_target_files


# ---------------------------------------------------------------------------
# STEP 5 — top-20 CRITICAL deep dive.
# ---------------------------------------------------------------------------

QUERY_TOKEN_STOPWORDS = {
    "appliance", "repair", "near", "me", "ca", "service", "cost", "price",
    "the", "a", "an", "in", "of", "and", "or", "to", "for", "same", "day",
}


def query_tokens(q: str) -> set[str]:
    toks = re.findall(r"[a-z0-9]+", q.lower())
    return {t for t in toks if t not in QUERY_TOKEN_STOPWORDS and len(t) > 1}


def find_astro_source(path: str) -> Path | None:
    """Map a URL path like /west-hollywood/refrigerator-repair/ to a src file.

    Handles:
      * /                              → src/pages/index.astro
      * /<slug>/                       → src/pages/<slug>.astro     (city pillar)
      * /<a>/<b>/                      → src/pages/<a>/<b>.astro    (parametric / hub sub)
      * deeper trees                   → src/pages/<a>/<b>/<c>.astro
      * any of those /index.astro      → fallback
    """
    if path == "/":
        return PAGES / "index.astro"
    parts = [p for p in path.strip("/").split("/") if p]
    if not parts:
        return PAGES / "index.astro"
    # try .astro at last segment
    candidates: list[Path] = []
    base = PAGES.joinpath(*parts[:-1]) if len(parts) > 1 else PAGES
    last = parts[-1]
    candidates.append(base / f"{last}.astro")
    candidates.append(base / last / "index.astro")
    # parametric (e.g. /<city>/<service>/) → src/pages/[city]/[service].astro
    if len(parts) == 2:
        candidates.append(PAGES / "[city]" / "[service].astro")
    # services hub patterns: /services/<slug>-repair/ may be /services/<slug>-repair.astro
    for c in candidates:
        if c.exists():
            return c
    return None


def word_count(astro: Path) -> int:
    try:
        txt = astro.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return -1
    # Strip frontmatter / scripts / style for rough body word count.
    txt = re.sub(r"^---[\s\S]*?---\n", "", txt, count=1)
    txt = re.sub(r"<script[\s\S]*?</script>", "", txt, flags=re.I)
    txt = re.sub(r"<style[\s\S]*?</style>", "", txt, flags=re.I)
    txt = TAG_STRIP.sub(" ", txt)
    txt = re.sub(r"\{[^{}]*\}", " ", txt)  # crude Astro expressions stripping
    words = re.findall(r"[A-Za-z][A-Za-z'\-]+", txt)
    return len(words)


def grep_token_hits(astro: Path | None, tokens: set[str]) -> int:
    if not astro or not astro.exists():
        return 0
    try:
        txt = astro.read_text(encoding="utf-8", errors="replace").lower()
    except Exception:
        return 0
    n = 0
    for t in tokens:
        n += len(re.findall(rf"\b{re.escape(t)}\b", txt))
    return n


def deep_dive(top_n: int = 20):
    cases = list(csv.DictReader(CANN_CSV.open(encoding="utf-8")))
    critical = [c for c in cases if c["severity"] == "CRITICAL"]
    critical.sort(key=lambda c: int(c["total_impressions"]), reverse=True)
    chosen = critical[:top_n]

    link_rows = crawl_links()
    by_target, by_target_files = build_target_index(link_rows)
    # save all-internal-links.csv
    LINKS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with LINKS_OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["source_file", "target", "anchor"])
        for r in link_rows:
            w.writerow([r["source_file"], r["target"], r["anchor"]])
    print(f"wrote {LINKS_OUT} ({len(link_rows)} rows)", file=sys.stderr)

    deep_rows = []
    for c in chosen:
        q = c["query"]
        intended = c["intended_url"]
        actual = c["actual_winner"]
        toks = query_tokens(q)
        intended_src = find_astro_source(intended)
        actual_src = find_astro_source(actual)
        in_links_intended = sum(by_target[intended].values())
        in_links_actual = sum(by_target[actual].values())
        # Top 3 anchors for intended.
        anchors = by_target[intended].most_common(3)
        anchors_str = "|".join(f"{a}({n})" for a, n in anchors) if anchors else "—"
        actual_anchors = by_target[actual].most_common(3)
        actual_anchors_str = "|".join(f"{a}({n})" for a, n in actual_anchors) if actual_anchors else "—"
        deep_rows.append({
            "query": q,
            "severity": c["severity"],
            "total_impressions": c["total_impressions"],
            "num_urls": c["num_urls"],
            "avg_position": c["avg_position"],
            "intended_url": intended,
            "intended_src": str(intended_src.relative_to(ROOT)).replace("\\", "/") if intended_src else "(missing)",
            "intended_words": word_count(intended_src) if intended_src else -1,
            "intended_in_links": in_links_intended,
            "intended_top_anchors": anchors_str,
            "intended_tok_hits": grep_token_hits(intended_src, toks),
            "actual_winner": actual,
            "actual_src": str(actual_src.relative_to(ROOT)).replace("\\", "/") if actual_src else "(missing)",
            "actual_words": word_count(actual_src) if actual_src else -1,
            "actual_in_links": in_links_actual,
            "actual_top_anchors": actual_anchors_str,
            "actual_tok_hits": grep_token_hits(actual_src, toks),
            "is_misaligned": c["is_misaligned"],
            "intended_imp": c["intended_imp"],
            "winner_imp": c["winner_imp"],
        })

    TOP20_OUT.parent.mkdir(parents=True, exist_ok=True)
    with TOP20_OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(deep_rows[0].keys()))
        w.writeheader()
        for r in deep_rows:
            w.writerow(r)
    print(f"wrote {TOP20_OUT}", file=sys.stderr)

    return deep_rows, by_target


# ---------------------------------------------------------------------------
# STEP 7 — hub dominance.
# ---------------------------------------------------------------------------

CITY_RE = re.compile(r"^/([a-z0-9-]+)/?$")
CITY_SERVICE_RE = re.compile(r"^/([a-z0-9-]+)/([a-z0-9-]+)/?$")


def hub_dominance():
    """For each query containing a non-hub city + service, see if hub URL is winner."""
    cases = list(csv.DictReader(CANN_CSV.open(encoding="utf-8")))
    rows = []
    hub_wins: dict[str, list[tuple[str, str, int]]] = defaultdict(list)
    # key = hub_slug ; value = list of (query, real_city, imp)
    for c in cases:
        q_low = c["query"].lower()
        actual = c["actual_winner"]
        intended = c["intended_url"]
        # Identify hub URL.
        hub_in_actual = None
        m = CITY_SERVICE_RE.match(actual)
        m2 = CITY_RE.match(actual)
        if m and m.group(1) in HUB_CITIES:
            hub_in_actual = m.group(1)
        elif m2 and m2.group(1) in HUB_CITIES:
            hub_in_actual = m2.group(1)
        # Identify "rightful" city from intended.
        rightful_city = None
        mi = CITY_SERVICE_RE.match(intended)
        mi2 = CITY_RE.match(intended)
        if mi:
            rightful_city = mi.group(1)
        elif mi2:
            rightful_city = mi2.group(1)
        if hub_in_actual and rightful_city and rightful_city != hub_in_actual and rightful_city not in HUB_CITIES:
            hub_wins[hub_in_actual].append((c["query"], rightful_city, int(c["total_impressions"])))
            rows.append({
                "hub": hub_in_actual,
                "displaced_city": rightful_city,
                "query": c["query"],
                "impressions": c["total_impressions"],
                "actual_winner": actual,
                "intended_url": intended,
                "severity": c["severity"],
            })

    HUB_OUT.parent.mkdir(parents=True, exist_ok=True)
    rows.sort(key=lambda r: -int(r["impressions"]))
    with HUB_OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["hub", "displaced_city", "query", "impressions",
                                          "actual_winner", "intended_url", "severity"])
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"wrote {HUB_OUT} ({len(rows)} rows)", file=sys.stderr)

    # Aggregate per hub.
    print("\nHub aggregate:", file=sys.stderr)
    for hub, items in sorted(hub_wins.items(), key=lambda kv: -sum(i[2] for i in kv[1])):
        total = sum(i[2] for i in items)
        cities = {i[1] for i in items}
        print(f"  {hub:18s}  {len(items):4d} queries  {len(cities):3d} cities  {total:5d} imps", file=sys.stderr)


def main() -> int:
    deep_dive(20)
    hub_dominance()
    return 0


if __name__ == "__main__":
    sys.exit(main())
