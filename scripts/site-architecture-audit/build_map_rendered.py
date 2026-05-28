"""Build site architecture map from RENDERED HTML (dist/).

For each .html file under dist/:
1. Reverse-engineer URL path from file location
2. Classify URL into a "block" using same rules as source audit
3. Extract all <a href="/..."> from rendered HTML (only static, but rendered HTML has everything Google sees)
4. Build matrix: source_block -> dest_block -> count
"""
import re
import json
from pathlib import Path
from collections import defaultdict, Counter

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
DIST = ROOT / "dist"

if not DIST.exists():
    print(f"ERROR: dist/ not found at {DIST}")
    raise SystemExit(1)

BLOCK_RULES = [
    ("homepage",            r"^$"),
    ("legal",               r"^(privacy-policy|terms|sitemap|404|search)$"),
    ("top_hub",             r"^(contact|book|credentials|price-list|for-business|about|areas|brands|services|outdoor|commercial)$"),
    ("blog_post",           r"^blog/.+$"),
    ("blog_hub",            r"^blog$"),
    ("brand_pillar",        r"^brands/[a-z][a-z0-9]*$"),
    ("brand_combo",         r"^brands/[a-z][a-z0-9-]+-repair$"),
    ("brand_other",         r"^brands/.+$"),
    ("county_hub",          r"^[a-z-]+-county$"),
    ("service_hub",         r"^services/[^/]+$"),
    ("service_sub",         r"^services/.+/.+$"),
    ("commercial_sub",      r"^commercial/.+$"),
    ("outdoor_sub",         r"^outdoor/.+$"),
    ("price_list_sub",      r"^price-list/.+$"),
    ("city_x_service",      r"^[a-z][a-z-]+/[a-z][a-z-]+$"),
    ("city_pillar",         r"^[a-z][a-z-]+$"),
]


def classify_path(url_path):
    p = url_path.strip("/").rstrip("/")
    p = re.sub(r"[?#].*$", "", p)
    for block_name, pattern in BLOCK_RULES:
        if re.match(pattern, p):
            return block_name
    return "unknown"


html_files = list(DIST.rglob("index.html"))
print(f"Total rendered HTML files: {len(html_files)}")

files_by_block = defaultdict(list)
file_to_block = {}
file_to_url = {}

for f in html_files:
    rel = f.relative_to(DIST).parent
    url_path = str(rel).replace("\\", "/") if str(rel) != "." else ""
    block = classify_path(url_path)
    files_by_block[block].append(url_path)
    file_to_block[str(f)] = block
    file_to_url[str(f)] = url_path

print("\nBlock sizes (rendered):")
for b, fs in sorted(files_by_block.items(), key=lambda x: -len(x[1])):
    print(f"  {b:25s} {len(fs):5d}")

HREF_RE = re.compile(r'href="(/[^"#?]*?)["#?]')
matrix = defaultdict(lambda: defaultdict(int))
inbound_totals = Counter()
unique_links_per_page = Counter()

for f in html_files:
    source_block = file_to_block[str(f)]
    try:
        content = f.read_text(encoding="utf-8")
    except Exception:
        continue
    hrefs_on_page = set()
    for href in HREF_RE.findall(content):
        if not href.startswith("/") or href.startswith("//"):
            continue
        hrefs_on_page.add(href)

    unique_links_per_page[source_block] += len(hrefs_on_page)

    for href in hrefs_on_page:
        dest_block = classify_path(href)
        matrix[source_block][dest_block] += 1
        inbound_totals[dest_block] += 1

output = {
    "total_files": len(html_files),
    "block_sizes": {b: len(fs) for b, fs in files_by_block.items()},
    "matrix": {src: dict(dests) for src, dests in matrix.items()},
    "inbound_totals": dict(inbound_totals),
    "unique_links_per_block_total": dict(unique_links_per_page),
}
out_json = ROOT / "audit-output" / "site-architecture-map-RENDERED.json"
out_json.write_text(json.dumps(output, indent=2), encoding="utf-8")

md = ["# Site Architecture - RENDERED HTML Audit\n"]
md.append(f"**Total rendered HTML files:** {len(html_files)}  ")
md.append(f"**Source:** dist/ (production build)  ")
md.append(f"**Generated:** 2026-05-25\n")
md.append("> This audit captures ALL hrefs Google sees, including component-injected and template-literal links. Previous source-file audit missed ~95% of links.\n")

md.append("## 1. Block sizes\n")
md.append("| Block | Pages | % |")
md.append("|---|---:|---:|")
for block, files in sorted(files_by_block.items(), key=lambda x: -len(x[1])):
    pct = 100 * len(files) / len(html_files)
    md.append(f"| `{block}` | {len(files)} | {pct:.1f}% |")

md.append("\n## 2. Inbound link totals per block (REAL)\n")
md.append("| Destination | Total inbound | Pages in block | Avg per page |")
md.append("|---|---:|---:|---:|")
for block, count in sorted(inbound_totals.items(), key=lambda x: -x[1]):
    size = len(files_by_block.get(block, []))
    avg = count / size if size > 0 else 0
    md.append(f"| `{block}` | {count} | {size} | {avg:.1f} |")

md.append("\n## 3. Average outbound unique links per page\n")
md.append("Shows page density - how many unique destinations each page links to.\n")
md.append("| Source block | Avg unique outbound | Pages |")
md.append("|---|---:|---:|")
for block, total in sorted(unique_links_per_page.items(), key=lambda x: -x[1]):
    size = len(files_by_block.get(block, []))
    avg = total / size if size > 0 else 0
    md.append(f"| `{block}` | {avg:.1f} | {size} |")

md.append("\n## 4. Critical gap re-check (with REAL data)\n")
GAP_CHECKS = [
    ("city_pillar", "brand_pillar", "City pages -> brand pillars"),
    ("brand_combo", "brand_pillar", "Brand combos -> pillars (Wave 48 result)"),
    ("city_x_service", "service_hub", "City x service combos -> service hubs"),
    ("city_x_service", "city_pillar", "City x service combos -> city pillars"),
    ("service_sub", "service_hub", "Service sub-pages -> service hubs"),
    ("brand_pillar", "brand_combo", "Brand pillars -> their category combos"),
    ("commercial_sub", "top_hub", "Commercial sub-pages -> commercial hub"),
    ("county_hub", "city_pillar", "County hubs -> their cities"),
    ("city_pillar", "county_hub", "City pages -> their county"),
    ("city_pillar", "city_pillar", "City pages -> nearby cities cross-link"),
    ("city_pillar", "service_hub", "City pages -> service hubs"),
    ("brand_combo", "brand_combo", "Brand combos -> sibling combos same brand"),
    ("city_x_service", "brand_pillar", "City x service -> brand pillars"),
    ("city_x_service", "city_x_service", "City x service -> other city x service"),
    ("service_sub", "service_sub", "Service sub -> sibling service subs"),
]
for src, dest, note in GAP_CHECKS:
    count = matrix.get(src, {}).get(dest, 0)
    src_size = len(files_by_block.get(src, []))
    if src_size == 0:
        continue
    avg = count / src_size
    flag = "RED GAP" if avg < 1 else ("YELLOW LOW" if avg < 3 else "GREEN OK")
    md.append(f"- **{flag}** `{src}` -> `{dest}`: {count} total, {avg:.1f} avg per source. {note}")

out_md = ROOT / "audit-output" / "site-architecture-report-RENDERED.md"
out_md.write_text("\n".join(md), encoding="utf-8")
print(f"\nSaved: {out_md}")
print(f"Saved: {out_json}")

print("\n=== Critical gap re-check ===")
for src, dest, note in GAP_CHECKS:
    count = matrix.get(src, {}).get(dest, 0)
    src_size = len(files_by_block.get(src, []))
    if src_size == 0: continue
    avg = count / src_size
    flag = "RED" if avg < 1 else ("YELLOW" if avg < 3 else "GREEN")
    print(f"  [{flag:6s}] {src:18s} -> {dest:18s}  {count:6d}  avg {avg:5.1f}")
