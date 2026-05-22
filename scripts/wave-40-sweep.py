"""Wave 40 — replace stale internal links with their final URLs.

Reads audit-output/wave-40-stale-links.json (file/stale/final triples).
Replaces only in href/url contexts (NOT in text content / comments / strings
that aren't link attributes). Preserves whitespace.
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
stale_data = json.loads(
    (ROOT / "audit-output" / "wave-40-stale-links.json").read_text(encoding="utf-8")
)

# Group by file: {file: set((stale, final))}
by_file: dict[str, set[tuple[str, str]]] = {}
for item in stale_data:
    by_file.setdefault(item["file"], set()).add((item["stale"], item["final"]))

changed: list[tuple[str, int]] = []
total_replacements = 0

# For each (stale, final) pair, replace inside href= / src= / url= attribute contexts.
# Use a function to handle the four context shapes.
def build_patterns(stale: str):
    e = re.escape(stale)
    return [
        # JSX/HTML attributes
        (re.compile(rf'(href=["\']){e}(["\'])'), "href_attr"),
        (re.compile(rf'(href=\{{["\']){e}(["\']\}})'), "href_jsx"),
        (re.compile(rf'(\burl=["\']){e}(["\'])'), "url_attr"),
        # JS/TS object properties
        (re.compile(rf'(\bhref:\s*["\']){e}(["\'])'), "href_prop"),
        (re.compile(rf'(\burl:\s*["\']){e}(["\'])'), "url_prop"),
        (re.compile(rf'(\bpath:\s*["\']){e}(["\'])'), "path_prop"),
        (re.compile(rf'(\bto:\s*["\']){e}(["\'])'), "to_prop"),
        # canonical = "..."
        (re.compile(rf'(\bcanonical\s*=\s*["\']){e}(["\'])'), "canonical_assign"),
    ]


for file_rel, pairs in by_file.items():
    path = ROOT / file_rel
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, PermissionError):
        continue

    original = text
    file_count = 0

    for stale, final in pairs:
        for pat, _ in build_patterns(stale):
            # Count occurrences before substituting
            matches = pat.findall(text)
            if not matches:
                continue
            text = pat.sub(rf"\g<1>{final}\g<2>", text)
            file_count += len(matches)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append((file_rel, file_count))
        total_replacements += file_count

print(f"=== Wave 40 sweep complete ===")
print(f"Files changed: {len(changed)}")
print(f"Total link replacements: {total_replacements}")
print()
print("=== Top 30 most-changed files ===")
for path, count in sorted(changed, key=lambda x: -x[1])[:30]:
    print(f"  {count:>3} replacements: {path}")
