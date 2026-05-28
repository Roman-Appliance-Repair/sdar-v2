"""Build site architecture map + internal linking matrix.

For each .astro file in src/pages/:
1. Classify by URL pattern into a "block" (city pillar, brand pillar, combo, etc.)
2. Extract all internal href="/..." links from the file
3. Classify each outgoing link by destination block
4. Build matrix: source_block -> dest_block -> count

Save:
- audit-output/site-architecture-map.json (raw data)
- audit-output/site-architecture-report.md (human-readable)
"""
import re
import json
from pathlib import Path
from collections import defaultdict, Counter

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
PAGES = ROOT / "src" / "pages"

BLOCK_RULES = [
    ("homepage",            r"^index\.astro$"),
    ("legal",               r"^(privacy-policy|terms|sitemap|404|search)\.astro$"),
    ("contact_book",        r"^(contact|book|credentials|price-list|for-business|about|areas|brands|services|outdoor)\.astro$"),
    ("blog_post",           r"^blog/.+\.astro$"),
    ("blog_hub",            r"^blog\.astro$"),
    ("brand_pillar",        r"^brands/[^/-]+\.astro$"),
    ("brand_combo",         r"^brands/[a-z][a-z0-9-]+-repair\.astro$"),
    ("brand_other",         r"^brands/.+\.astro$"),
    ("county_hub",          r"^[a-z-]+-county\.astro$"),
    ("service_hub",         r"^services/[^/]+\.astro$"),
    ("service_sub",         r"^services/.+/.+\.astro$"),
    ("commercial_hub",      r"^commercial\.astro$"),
    ("commercial_sub",      r"^commercial/.+\.astro$"),
    ("outdoor_sub",         r"^outdoor/.+\.astro$"),
    ("price_list_sub",      r"^price-list/.+\.astro$"),
    ("city_x_service_tmpl", r"^\[city\]/\[service\]\.astro$"),
    ("city_service_tmpl",   r"^\[city\]/.+\.astro$"),
    ("city_pillar",         r"^[a-z][a-z-]+\.astro$"),
]


def classify_file(rel_path):
    path_str = str(rel_path).replace("\\", "/")
    for block_name, pattern in BLOCK_RULES:
        if re.match(pattern, path_str):
            return block_name
    return "unknown"


def classify_url(url):
    u = url.lstrip("/").rstrip("/")
    u = re.sub(r"[?#].*$", "", u)

    if u == "" or u == "/":
        return "homepage"

    parts = u.split("/")

    if parts[0] == "brands":
        if len(parts) == 1:
            return "contact_book"
        if len(parts) == 2:
            slug = parts[1]
            if "-repair" in slug:
                return "brand_combo"
            return "brand_pillar"
        return "brand_other"

    if parts[0] == "services":
        if len(parts) == 1:
            return "contact_book"
        if len(parts) == 2:
            return "service_hub"
        return "service_sub"

    if parts[0] == "commercial":
        if len(parts) == 1:
            return "commercial_hub"
        return "commercial_sub"

    if parts[0] == "outdoor":
        return "outdoor_sub"

    if parts[0] == "price-list":
        if len(parts) == 1:
            return "contact_book"
        return "price_list_sub"

    if parts[0].endswith("-county"):
        return "county_hub"

    if parts[0] == "blog":
        if len(parts) == 1:
            return "blog_hub"
        return "blog_post"

    if parts[0] in ("privacy-policy", "terms", "sitemap", "404", "search"):
        return "legal"

    if parts[0] in ("contact", "book", "credentials", "price-list", "for-business", "about", "areas"):
        return "contact_book"

    if len(parts) == 1:
        return "city_pillar"
    if len(parts) >= 2:
        return "city_x_service"

    return "unknown"


all_files = list(PAGES.rglob("*.astro"))
print(f"Total .astro files: {len(all_files)}")

files_by_block = defaultdict(list)
file_to_block = {}
for f in all_files:
    rel = f.relative_to(PAGES)
    block = classify_file(rel)
    files_by_block[block].append(str(rel).replace("\\", "/"))
    file_to_block[str(rel).replace("\\", "/")] = block

print("\n=== Block sizes ===")
for block, files in sorted(files_by_block.items(), key=lambda x: -len(x[1])):
    print(f"  {block:25s} {len(files):5d}")

HREF_RE = re.compile(r'href="(/[^"#?]*?)["#?]')

matrix = defaultdict(lambda: defaultdict(int))
inbound_totals = Counter()
per_page_outbound = defaultdict(list)

for f in all_files:
    rel = str(f.relative_to(PAGES)).replace("\\", "/")
    source_block = file_to_block[rel]

    try:
        content = f.read_text(encoding="utf-8")
    except Exception:
        continue

    hrefs = HREF_RE.findall(content)
    for href in hrefs:
        if not href.startswith("/"):
            continue
        if href.startswith("//"):
            continue

        dest_block = classify_url(href)
        matrix[source_block][dest_block] += 1
        inbound_totals[dest_block] += 1
        per_page_outbound[rel].append((dest_block, href))

out_json = ROOT / "audit-output" / "site-architecture-map.json"
out_json.parent.mkdir(exist_ok=True)
output = {
    "total_files": len(all_files),
    "block_sizes": {b: len(fs) for b, fs in files_by_block.items()},
    "matrix": {src: dict(dests) for src, dests in matrix.items()},
    "inbound_totals": dict(inbound_totals),
}
out_json.write_text(json.dumps(output, indent=2), encoding="utf-8")
print(f"\nSaved JSON: {out_json}")

md = ["# Site Architecture + Internal Linking Matrix\n"]
md.append(f"**Total .astro files:** {len(all_files)}\n")
md.append(f"**Generated:** 2026-05-25\n\n")

md.append("## 1. Block sizes\n\n")
md.append("| Block | Page count | % of site |")
md.append("|---|---:|---:|")
for block, files in sorted(files_by_block.items(), key=lambda x: -len(x[1])):
    pct = 100 * len(files) / len(all_files)
    md.append(f"| `{block}` | {len(files)} | {pct:.1f}% |")
md.append("")

md.append("## 2. Inbound link totals per block (authority received)\n\n")
md.append("| Destination block | Total inbound links | Avg links per page in block |")
md.append("|---|---:|---:|")
for block, count in sorted(inbound_totals.items(), key=lambda x: -x[1]):
    size = len(files_by_block.get(block, []))
    avg = count / size if size > 0 else 0
    md.append(f"| `{block}` | {count} | {avg:.1f} |")
md.append("")

md.append("## 3. Linking matrix — counts of source -> destination\n\n")
all_blocks = sorted(set(list(files_by_block.keys()) + list(inbound_totals.keys())))
header = "| Source / Dest -> | " + " | ".join(f"`{b[:10]}`" for b in all_blocks) + " | Total out |"
md.append(header)
md.append("|" + "---|" * (len(all_blocks) + 2))
for src in sorted(matrix.keys()):
    row = [f"`{src}`"]
    total = 0
    for dest in all_blocks:
        count = matrix[src].get(dest, 0)
        total += count
        if count == 0:
            row.append(".")
        else:
            row.append(str(count))
    row.append(f"**{total}**")
    md.append("| " + " | ".join(row) + " |")
md.append("")

md.append("## 4. Critical gaps (zero or low link flows)\n\n")
md.append("Looking for source_block -> dest_block pairs that should exist but show 0 or very low counts:\n\n")

GAP_CHECKS = [
    ("city_pillar", "brand_pillar", "City pages should link to brand pillars (Phase B candidate)"),
    ("brand_combo", "brand_pillar", "Brand combo pages should link to their pillars (Wave 48 fixed this)"),
    ("city_x_service_tmpl", "service_hub", "City x service combos should link to service hubs"),
    ("city_x_service_tmpl", "city_pillar", "City x service combos should link to city pillars"),
    ("service_sub", "service_hub", "Service sub-pages (failure modes) should link to service hubs"),
    ("brand_pillar", "brand_combo", "Brand pillars should link to their category combos"),
    ("commercial_sub", "commercial_hub", "Commercial sub-pages should link to commercial hub"),
    ("county_hub", "city_pillar", "County hubs should link to their cities"),
    ("city_pillar", "county_hub", "City pages should link to their county"),
    ("city_pillar", "city_pillar", "City pages should cross-link nearby cities"),
]

for src, dest, note in GAP_CHECKS:
    count = matrix.get(src, {}).get(dest, 0)
    src_size = len(files_by_block.get(src, []))
    dest_size = len(files_by_block.get(dest, []))
    if src_size == 0 or dest_size == 0:
        continue
    avg_per_src = count / src_size if src_size > 0 else 0
    flag = "RED GAP" if avg_per_src < 1 else ("YELLOW LOW" if avg_per_src < 3 else "GREEN OK")
    md.append(f"- **{flag}** `{src}` -> `{dest}`: {count} links total, {avg_per_src:.1f} avg per source page. {note}")
md.append("")

md.append("## 5. Verdict\n\n")
md.append("_(Manual interpretation needed - see ranked gaps above and matrix table.)_\n")

out_md = ROOT / "audit-output" / "site-architecture-report.md"
out_md.write_text("\n".join(md), encoding="utf-8")
print(f"Saved markdown: {out_md}")

print("\n=== Top 5 gaps ===")
for src, dest, note in GAP_CHECKS[:5]:
    count = matrix.get(src, {}).get(dest, 0)
    src_size = len(files_by_block.get(src, []))
    avg = count / src_size if src_size > 0 else 0
    print(f"  {src:30s} -> {dest:25s}  {count:5d} total, {avg:.1f} avg")
