"""Wave 30 — Structural audit (read-only).

Steps:
1. Content integrity — pages with low visible body text
2. H1 visibility — invisible (white-on-white) heading detection
3. aggregateRating SSOT audit — schema vs visible body
4. Schema presence per page type
5. Pricing tier sanity check ($89/$120/outdoor)

Output: stdout markdown report + per-step CSV files in audit-results/
"""
from pathlib import Path
from bs4 import BeautifulSoup
import json
import re
import csv
import random

ROOT = Path(__file__).parent.parent
DIST = ROOT / "dist"
SRC_PAGES = ROOT / "src" / "pages"
OUT_DIR = ROOT / "audit-results"
OUT_DIR.mkdir(exist_ok=True)


def get_visible_text(html: str) -> str:
    """Strip head, script, style, nav, footer; return visible body text."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "head", "nav", "footer"]):
        tag.decompose()
    # Sometimes header containing nav lives outside <nav>
    for tag in soup.select("header, [role=navigation]"):
        tag.decompose()
    return soup.get_text(" ", strip=True)


def is_redirect_page(html: str) -> bool:
    """Detect HTML meta refresh / JS-only redirect pages."""
    lower = html.lower()
    if "<meta http-equiv=\"refresh\"" in lower or "meta http-equiv='refresh'" in lower:
        return True
    if "window.location" in lower and len(html) < 2000:
        return True
    return False


# ─────────────────────────────────────────────────────────────────────
# STEP 1 — Content integrity
# ─────────────────────────────────────────────────────────────────────
def step1_content_integrity():
    print("\n=== STEP 1 — Content integrity ===\n")
    rows = []
    for html_file in DIST.rglob("index.html"):
        rel = str(html_file.relative_to(DIST)).replace("\\", "/")
        url_path = "/" + rel.replace("/index.html", "/") if rel != "index.html" else "/"
        try:
            text = html_file.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        visible = get_visible_text(text)
        nchars = len(visible)
        is_redirect = is_redirect_page(text)
        if nchars < 500:
            cat = "redirect" if is_redirect else "EMPTY"
        elif nchars < 1500:
            cat = "thin"
        else:
            cat = "ok"
        rows.append({
            "url": url_path,
            "chars": nchars,
            "category": cat,
            "is_redirect": is_redirect,
        })

    # Output CSV
    with (OUT_DIR / "step1_content.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["url", "chars", "category", "is_redirect"])
        w.writeheader()
        w.writerows(rows)

    empty = [r for r in rows if r["category"] == "EMPTY"]
    thin = [r for r in rows if r["category"] == "thin"]
    redirects = [r for r in rows if r["category"] == "redirect"]
    ok = [r for r in rows if r["category"] == "ok"]

    print(f"Total pages scanned:     {len(rows)}")
    print(f"  content-rich (>=1500): {len(ok)}")
    print(f"  thin (500-1499):       {len(thin)}")
    print(f"  EMPTY (<500):          {len(empty)}")
    print(f"  redirect-pages:        {len(redirects)}")

    if empty:
        print("\nEMPTY pages (NOT redirects):")
        for r in sorted(empty, key=lambda x: x["chars"])[:30]:
            print(f"  [{r['chars']:>4} chars] {r['url']}")

    if thin:
        print("\nTHIN pages (sample 20):")
        for r in sorted(thin, key=lambda x: x["chars"])[:20]:
            print(f"  [{r['chars']:>4} chars] {r['url']}")

    return rows


# ─────────────────────────────────────────────────────────────────────
# STEP 2 — H1 visibility
# ─────────────────────────────────────────────────────────────────────
def parse_color(s: str):
    """Normalize color string to (r,g,b) or None."""
    if not s:
        return None
    s = s.strip().lower()
    # hex
    m = re.match(r"#([0-9a-f]{3})$", s)
    if m:
        h = m.group(1)
        return (int(h[0]*2, 16), int(h[1]*2, 16), int(h[2]*2, 16))
    m = re.match(r"#([0-9a-f]{6})$", s)
    if m:
        h = m.group(1)
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    # rgb()
    m = re.match(r"rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)", s)
    if m:
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    named = {
        "white": (255,255,255), "black": (0,0,0),
        "red": (255,0,0), "fff": (255,255,255), "000": (0,0,0),
    }
    return named.get(s)


def luminance(rgb):
    r, g, b = [c/255 for c in rgb]
    def f(x):
        return x/12.92 if x <= 0.03928 else ((x+0.055)/1.055)**2.4
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b)


def step2_h1_visibility():
    print("\n=== STEP 2 — H1 visibility ===\n")
    issues = []
    total_h1 = 0
    pages_no_h1 = []
    for html_file in DIST.rglob("index.html"):
        rel = str(html_file.relative_to(DIST)).replace("\\", "/")
        url_path = "/" + rel.replace("/index.html", "/") if rel != "index.html" else "/"
        try:
            text = html_file.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if is_redirect_page(text):
            continue
        soup = BeautifulSoup(text, "html.parser")
        h1s = soup.find_all("h1")
        if not h1s:
            pages_no_h1.append(url_path)
            continue
        for h1 in h1s:
            total_h1 += 1
            inline = h1.get("style", "") or ""
            classes = " ".join(h1.get("class", []))
            # Walk up parents collecting bg context
            bg_parents = []
            p = h1.parent
            depth = 0
            while p and depth < 5:
                pinline = p.get("style", "") or "" if hasattr(p, "get") else ""
                pclasses = " ".join(p.get("class", [])) if hasattr(p, "get") else ""
                bg_parents.append({"style": pinline, "class": pclasses, "tag": getattr(p, "name", "")})
                p = getattr(p, "parent", None)
                depth += 1

            # Look for "color:" in inline
            mcolor = re.search(r"color\s*:\s*([^;]+)", inline)
            color_val = mcolor.group(1).strip() if mcolor else None
            # Look for background in nearest parents
            bg_val = None
            for bp in bg_parents:
                mbg = re.search(r"background(?:-color)?\s*:\s*([^;]+)", bp["style"])
                if mbg:
                    bg_val = mbg.group(1).strip().split(" ")[0]
                    break

            # Also check for visibility/opacity
            display_none = re.search(r"display\s*:\s*none", inline)
            visibility_hidden = re.search(r"visibility\s*:\s*hidden", inline)
            opacity_zero = re.search(r"opacity\s*:\s*0\b", inline)

            # Try to flag white-on-white, black-on-black
            crgb = parse_color(color_val) if color_val else None
            brgb = parse_color(bg_val) if bg_val else None
            problem = None
            if display_none:
                problem = "display:none"
            elif visibility_hidden:
                problem = "visibility:hidden"
            elif opacity_zero:
                problem = "opacity:0"
            elif crgb and brgb:
                lc = luminance(crgb)
                lb = luminance(brgb)
                contrast = (max(lc, lb)+0.05)/(min(lc, lb)+0.05)
                if contrast < 1.5:
                    problem = f"low-contrast({contrast:.2f})"

            if problem:
                issues.append({
                    "url": url_path,
                    "h1_text": (h1.get_text()[:80] + "…") if len(h1.get_text()) > 80 else h1.get_text(),
                    "color": color_val or "",
                    "bg": bg_val or "",
                    "issue": problem,
                })

    with (OUT_DIR / "step2_h1.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["url","h1_text","color","bg","issue"])
        w.writeheader()
        w.writerows(issues)

    print(f"Total <h1> tags scanned: {total_h1}")
    print(f"Pages with NO <h1>:      {len(pages_no_h1)}")
    print(f"H1 visibility issues:    {len(issues)}")
    if issues:
        print("\nIssues found:")
        for i in issues[:30]:
            print(f"  {i['url']}\n     H1: {i['h1_text']}\n     {i['issue']} (color={i['color']} bg={i['bg']})")

    if pages_no_h1[:20]:
        print("\nPages with no H1 (first 20):")
        for u in pages_no_h1[:20]:
            print(f"  {u}")

    return issues, pages_no_h1


# ─────────────────────────────────────────────────────────────────────
# STEP 3 — aggregateRating SSOT
# ─────────────────────────────────────────────────────────────────────
def step3_agg_rating():
    print("\n=== STEP 3 — aggregateRating SSOT ===\n")
    schema_hits = []
    visible_hits = []
    for ast in SRC_PAGES.rglob("*.astro"):
        try:
            text = ast.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if "aggregateRating" not in text:
            continue
        # Determine context: in <script type="application/ld+json"> or visible
        # Crude check: split on <script> tags
        # Find every position of aggregateRating and check if inside script tag
        for m in re.finditer(r"aggregateRating", text):
            pos = m.start()
            # Look backwards for nearest <script or </script>
            preceding = text[:pos]
            last_open = preceding.rfind("<script")
            last_close = preceding.rfind("</script>")
            if last_open > last_close:
                schema_hits.append({"file": str(ast.relative_to(ROOT)), "pos": pos})
            else:
                visible_hits.append({"file": str(ast.relative_to(ROOT)), "pos": pos})

    schema_files = sorted(set(h["file"] for h in schema_hits))
    visible_files = sorted(set(h["file"] for h in visible_hits))

    with (OUT_DIR / "step3_aggregaterating.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["context", "file"])
        for fp in schema_files:
            w.writerow(["json-ld", fp])
        for fp in visible_files:
            w.writerow(["visible-body", fp])

    print(f"Total .astro files with aggregateRating: {len(schema_files) + len(visible_files)}")
    print(f"  In JSON-LD schema:        {len(schema_files)}")
    print(f"  In visible body (BAD):    {len(visible_files)}")
    if visible_files:
        print("\nVISIBLE-BODY violations (should be 0):")
        for f in visible_files[:30]:
            print(f"  {f}")
    print(f"\nFiles with rating in JSON-LD (sample 15 of {len(schema_files)}):")
    for f in schema_files[:15]:
        print(f"  {f}")
    return schema_files, visible_files


# ─────────────────────────────────────────────────────────────────────
# STEP 4 — Schema presence by page type
# ─────────────────────────────────────────────────────────────────────
PAGE_TYPE_REQUIREMENTS = {
    "homepage": ["LocalBusiness"],  # Organization/WebSite often via Layout
    "hub_service": ["BreadcrumbList"],  # Service/LocalBusiness preferred
    "service_pillar": ["Service", "FAQPage", "BreadcrumbList"],
    "city_service": ["Service", "LocalBusiness", "BreadcrumbList"],
    "city_pillar": ["LocalBusiness", "BreadcrumbList"],
    "brand_page": ["BreadcrumbList"],  # Brand or Service depending
    "blog_article": ["BlogPosting"],
    "price_list_cost": ["BreadcrumbList"],
}


def extract_jsonld_types(html: str):
    soup = BeautifulSoup(html, "html.parser")
    types = []
    for sc in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(sc.string or "")
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        # Handle @graph
        for it in items:
            if isinstance(it, dict) and "@graph" in it:
                for sub in it["@graph"]:
                    if isinstance(sub, dict):
                        t = sub.get("@type")
                        if t:
                            types.append(t if isinstance(t, str) else " | ".join(t) if isinstance(t, list) else str(t))
            elif isinstance(it, dict):
                t = it.get("@type")
                if t:
                    types.append(t if isinstance(t, str) else " | ".join(t) if isinstance(t, list) else str(t))
    return types


def step4_schema_presence():
    print("\n=== STEP 4 — Schema presence by page type ===\n")
    samples = {
        "homepage": ["index.html"],
        "hub_service": [
            "services/index.html", "commercial/index.html", "outdoor/index.html",
            "for-business/index.html", "credentials/index.html",
        ],
        "service_pillar": [
            "services/refrigerator-repair/index.html",
            "services/dryer-repair/index.html",
            "services/washer-repair/index.html",
            "services/oven-repair/index.html",
            "services/dishwasher-repair/index.html",
        ],
        "city_service": [
            "west-hollywood/refrigerator-repair/index.html",
            "beverly-hills/oven-repair/index.html",
            "pasadena/washer-repair/index.html",
            "santa-monica/dryer-repair/index.html",
            "burbank/dishwasher-repair/index.html",
        ],
        "city_pillar": [
            "west-hollywood/index.html", "beverly-hills/index.html",
            "pasadena/index.html", "santa-monica/index.html", "burbank/index.html",
        ],
        "brand_page": [
            "brands/sub-zero/index.html", "brands/wolf/index.html",
            "brands/miele/index.html", "brands/viking/index.html",
            "brands/thermador/index.html",
        ],
        "blog_article": [
            "blog/sub-zero-replacement-vs-repair-decision/index.html",
            "blog/lg-vs-samsung-washer-which-breaks-down-less/index.html",
        ],
        "price_list_cost": [
            "price-list/refrigerator-repair-cost/index.html",
            "price-list/dryer-repair-cost/index.html",
            "price-list/oven-repair-cost/index.html",
        ],
    }

    rows = []
    for cat, paths in samples.items():
        required = PAGE_TYPE_REQUIREMENTS.get(cat, [])
        for p in paths:
            html_file = DIST / p
            if not html_file.exists():
                rows.append({"category": cat, "url": p, "exists": False, "types": "", "missing": ",".join(required)})
                continue
            text = html_file.read_text(encoding="utf-8", errors="ignore")
            types = extract_jsonld_types(text)
            type_set = set()
            for t in types:
                for sub in t.split(" | "):
                    type_set.add(sub.strip())
            missing = [r for r in required if r not in type_set]
            rows.append({
                "category": cat,
                "url": "/" + p.replace("/index.html", "/"),
                "exists": True,
                "types": " | ".join(types),
                "missing": ",".join(missing) if missing else "OK",
            })

    with (OUT_DIR / "step4_schema.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["category", "url", "exists", "types", "missing"])
        w.writeheader()
        w.writerows(rows)

    by_cat = {}
    for r in rows:
        by_cat.setdefault(r["category"], []).append(r)
    for cat, items in by_cat.items():
        print(f"\n[{cat}] required={PAGE_TYPE_REQUIREMENTS.get(cat, [])}")
        for r in items:
            mark = "OK" if r["missing"] == "OK" else f"MISSING: {r['missing']}"
            print(f"  {r['url']}")
            print(f"     types: {r['types'] or '(none)'}")
            print(f"     {mark}")
    return rows


# ─────────────────────────────────────────────────────────────────────
# STEP 5 — Pricing tier sanity
# ─────────────────────────────────────────────────────────────────────
def step5_pricing():
    print("\n=== STEP 5 — Pricing tier sanity check ===\n")
    issues = []

    def has_diag89(text: str) -> bool:
        return bool(re.search(r"\$89(?:\s|<|&|\b)", text)) and "diagnostic" in text.lower()

    def has_diag120(text: str) -> bool:
        # exclude $1200, $1207 — only $120 followed by non-digit
        return bool(re.search(r"\$120(?:\s|<|&|\.|\b)(?!\d)", text)) and "diagnostic" in text.lower()

    # A) Residential service pages — sample 20
    res_files = sorted((SRC_PAGES / "services").glob("*.astro"))[:20]
    res_violations = 0
    for fp in res_files:
        text = fp.read_text(encoding="utf-8", errors="ignore")
        # $89 OK; $120 diagnostic = violation
        # We have to be careful: $120 might appear as "Commercial $120" cross-reference
        # Look for "$120" "diagnostic" in same sentence
        bad = re.search(r"\$120[^.\n]{0,80}diagnostic", text, re.I)
        if bad and "commercial" not in bad.group(0).lower():
            res_violations += 1
            issues.append({"category": "residential", "file": str(fp.relative_to(ROOT)), "match": bad.group(0)[:120]})

    # B) Commercial pages — sample 20
    com_files = sorted((SRC_PAGES / "commercial").glob("*.astro"))[:20]
    com_violations = 0
    for fp in com_files:
        text = fp.read_text(encoding="utf-8", errors="ignore")
        bad = re.search(r"\$89[^.\n]{0,80}diagnostic", text, re.I)
        if bad and "residential" not in bad.group(0).lower():
            # might still be cross-link mention of residential pricing
            com_violations += 1
            issues.append({"category": "commercial", "file": str(fp.relative_to(ROOT)), "match": bad.group(0)[:120]})

    # C) Outdoor pages — verify $120
    out_files = list((SRC_PAGES / "outdoor").rglob("*.astro"))
    out_violations = 0
    out_files_with_89 = []
    for fp in out_files:
        text = fp.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"\$89(?:\s|<|&|\.|\b)(?!\d)", text):
            out_files_with_89.append(str(fp.relative_to(ROOT)))
            # Check if it's a true diagnostic claim
            bad = re.search(r"\$89[^.\n]{0,80}diagnostic", text, re.I)
            if bad and "residential" not in bad.group(0).lower():
                out_violations += 1
                issues.append({"category": "outdoor", "file": str(fp.relative_to(ROOT)), "match": bad.group(0)[:120]})

    # D) Sample 30 random city × service pages from dist
    city_service_files = []
    for d in DIST.iterdir():
        if not d.is_dir():
            continue
        # Look for /city/service/index.html
        for sub in d.iterdir():
            if sub.is_dir() and (sub / "index.html").exists():
                if any(k in sub.name for k in ["repair"]):
                    city_service_files.append(sub / "index.html")
    sample_city = random.sample(city_service_files, min(30, len(city_service_files))) if city_service_files else []
    cs_violations = 0
    for fp in sample_city:
        text = fp.read_text(encoding="utf-8", errors="ignore")
        # exclude commercial pages
        url = "/" + str(fp.relative_to(DIST)).replace("\\", "/").replace("/index.html", "/")
        if "commercial" in url:
            continue
        bad = re.search(r"\$120[^.\n<]{0,80}diagnostic", text, re.I)
        if bad and "commercial" not in bad.group(0).lower():
            cs_violations += 1
            issues.append({"category": "city_service", "file": url, "match": bad.group(0)[:120]})

    with (OUT_DIR / "step5_pricing.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["category", "file", "match"])
        w.writeheader()
        w.writerows(issues)

    print(f"A) Residential (sample {len(res_files)}): {res_violations} violations")
    print(f"B) Commercial  (sample {len(com_files)}): {com_violations} violations")
    print(f"C) Outdoor     (all {len(out_files)} files):")
    print(f"     files with any $89 mention: {len(out_files_with_89)}")
    print(f"     true diagnostic violations: {out_violations}")
    if out_files_with_89:
        print("     files with $89 (any context):")
        for f in out_files_with_89[:15]:
            print(f"       {f}")
    print(f"D) City × Service (sample {len(sample_city)}): {cs_violations} violations")

    if issues:
        print("\nViolations detail:")
        for i in issues[:30]:
            print(f"  [{i['category']}] {i['file']}")
            print(f"     match: {i['match']}")
    return issues


def main():
    step1_content_integrity()
    step2_h1_visibility()
    step3_agg_rating()
    step4_schema_presence()
    step5_pricing()


if __name__ == "__main__":
    main()
