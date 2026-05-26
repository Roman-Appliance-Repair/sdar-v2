"""Wave 52a - identify <li><strong>{Brand}</strong> patterns in commercial subs needing linkification."""
import re
import json
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
COMMERCIAL_DIR = ROOT / "src" / "pages" / "commercial"
MAP_FILE = ROOT / "src" / "data" / "brand-pillar-map.ts"

map_content = MAP_FILE.read_text(encoding="utf-8")
brand_map = {}
for match in re.finditer(r"'([^']+)':\s*'([^']+)'", map_content):
    brand_map[match.group(1)] = match.group(2)

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

files = sorted(COMMERCIAL_DIR.rglob("*.astro"))
print(f"Scanning {len(files)} commercial files (recursive)")

for f in files:
    try:
        content = f.read_text(encoding="utf-8")
    except Exception as e:
        parse_fails.append({"file": str(f.relative_to(COMMERCIAL_DIR)), "error": str(e)})
        continue

    file_matches = []
    for m in LI_STRONG_RE.finditer(content):
        prefix = m.group(1)
        inner_text = m.group(2).strip()
        suffix = m.group(3)

        start_pos = m.start()
        lookback = content[max(0, start_pos - 30):start_pos]
        if A_STRONG_RE.search(lookback + prefix):
            skip_already_linked.append({"file": str(f.relative_to(COMMERCIAL_DIR)), "text": inner_text})
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
            skip_unknown_brand.append({"file": str(f.relative_to(COMMERCIAL_DIR)), "text": inner_text})
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
            "file": str(f.relative_to(COMMERCIAL_DIR)),
            "abs_path": str(f),
            "matches_count": len(file_matches),
            "matches": file_matches,
        })

out = ROOT / "audit-output" / "wave-52-candidates.json"
out.write_text(json.dumps({
    "files_with_candidates": len(candidates),
    "total_link_injections": sum(c["matches_count"] for c in candidates),
    "skip_already_linked": len(skip_already_linked),
    "skip_unknown_brand_count": len(skip_unknown_brand),
    "parse_fails": parse_fails,
    "candidates": candidates,
    "skip_unknown_brand_sample": skip_unknown_brand[:20],
}, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"\n=== WAVE 52a DRY RUN ===")
print(f"Files scanned:                  {len(files)}")
print(f"Files with candidates:          {len(candidates)}")
print(f"Total link injections planned:  {sum(c['matches_count'] for c in candidates)}")
print(f"Skipped - already linked:       {len(skip_already_linked)}")
print(f"Skipped - unknown brand:        {len(skip_unknown_brand)}")
print(f"Parse failures:                 {len(parse_fails)}")

print(f"\nTop 20 files by injection count:")
for c in sorted(candidates, key=lambda x: -x["matches_count"])[:20]:
    samples = [m["brand"] for m in c["matches"][:5]]
    print(f"  {c['file']:55s} +{c['matches_count']:3d} {samples}")

print(f"\nFirst 15 unknown brand samples:")
for s in skip_unknown_brand[:15]:
    print(f"  {s['file']:55s} '{s['text'][:70]}'")
