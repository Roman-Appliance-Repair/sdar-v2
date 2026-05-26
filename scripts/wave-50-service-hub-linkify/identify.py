"""Identify <li><strong>{Brand}</strong>... patterns in service hubs needing linkification.

For each .astro file in src/pages/services/ (excluding index):
1. Find all <li><strong>{anything}</strong> patterns (with or without colon)
2. Check if {anything} matches a known brand in BRAND_PILLAR_MAP
3. Check if <strong> is already wrapped in <a> (idempotent skip)
4. Build candidate list per file
"""
import re
import json
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
HUBS_DIR = ROOT / "src" / "pages" / "services"
MAP_FILE = ROOT / "src" / "data" / "brand-pillar-map.ts"

map_content = MAP_FILE.read_text(encoding="utf-8")
brand_map = {}
for match in re.finditer(r"'([^']+)':\s*'([^']+)'", map_content):
    display, slug = match.groups()
    brand_map[display] = slug

print(f"Loaded {len(brand_map)} brand mappings")

brand_displays_sorted = sorted(brand_map.keys(), key=len, reverse=True)

LI_STRONG_RE = re.compile(
    r'(<li[^>]*>\s*<strong>)([^<]+?)(</strong>)',
    re.MULTILINE
)

A_STRONG_RE = re.compile(r'<a\s[^>]*?>\s*<strong>')

candidates = []
skip_already_linked = []
skip_unknown_brand = []
parse_fails = []

hub_files = sorted(HUBS_DIR.glob("*.astro"))
hub_files = [f for f in hub_files if f.stem != "index"]

for f in hub_files:
    try:
        content = f.read_text(encoding="utf-8")
    except Exception as e:
        parse_fails.append({"file": f.name, "error": str(e)})
        continue

    file_matches = []
    for m in LI_STRONG_RE.finditer(content):
        prefix = m.group(1)
        inner_text = m.group(2).strip()
        suffix = m.group(3)

        start_pos = m.start()
        lookback = content[max(0, start_pos - 30):start_pos]
        if A_STRONG_RE.search(lookback + prefix):
            skip_already_linked.append({"file": f.name, "text": inner_text})
            continue

        matched_brand = None
        for brand in brand_displays_sorted:
            if inner_text == brand:
                matched_brand = brand
                break
            if inner_text.startswith(brand + " (") or inner_text.startswith(brand + ":"):
                matched_brand = brand
                break
            if inner_text.rstrip(":").strip() == brand:
                matched_brand = brand
                break

        if not matched_brand:
            skip_unknown_brand.append({"file": f.name, "text": inner_text})
            continue

        file_matches.append({
            "match_start": m.start(),
            "match_end": m.end(),
            "inner_text": inner_text,
            "brand": matched_brand,
            "slug": brand_map[matched_brand],
        })

    if file_matches:
        candidates.append({
            "file": f.name,
            "matches_count": len(file_matches),
            "matches": file_matches,
        })

out = ROOT / "audit-output" / "wave-50-candidates.json"
out.write_text(json.dumps({
    "files_with_candidates": len(candidates),
    "total_link_injections": sum(c["matches_count"] for c in candidates),
    "skip_already_linked": len(skip_already_linked),
    "skip_unknown_brand_count": len(skip_unknown_brand),
    "parse_fails": parse_fails,
    "candidates": candidates,
    "skip_already_linked_sample": skip_already_linked[:10],
    "skip_unknown_brand_sample": skip_unknown_brand[:20],
}, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"\n=== WAVE 50 DRY RUN ===")
print(f"Hub files scanned:              {len(hub_files)}")
print(f"Files with candidates:          {len(candidates)}")
print(f"Total link injections planned:  {sum(c['matches_count'] for c in candidates)}")
print(f"Skipped - already linked:       {len(skip_already_linked)}")
print(f"Skipped - unknown brand:        {len(skip_unknown_brand)}")
print(f"Parse failures:                 {len(parse_fails)}")

print(f"\nPer-file breakdown (top 15):")
for c in sorted(candidates, key=lambda x: -x["matches_count"])[:15]:
    print(f"  {c['file']:50s} +{c['matches_count']} links")

print(f"\nFirst 20 unknown brand strings (skipped):")
for s in skip_unknown_brand[:20]:
    print(f"  {s['file']:50s} '{s['text']}'")
