"""Wave 40 — find internal links pointing to redirected URLs.

Scans src/ for href/url patterns matching keys in redirect-map.json.
Reports counts and saves full list to audit-output/wave-40-stale-links.json.
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"

redirect_map: dict[str, str] = json.loads(
    (ROOT / "audit-output" / "redirect-map.json").read_text(encoding="utf-8")
)
redirect_keys = set(redirect_map.keys())

# Patterns where a URL appears in source. Captures the URL value.
# Two families:
#   A) JSX/HTML attributes: href="X", href={'X'}, src="X", url="X"
#   B) JS/TS object properties + variable assignments:
#        href: 'X', url: 'X', path: 'X', to: 'X',
#        canonical = "X" (incl. full https://samedayappliance.repair/X/ form)
LINK_PATTERNS = [
    re.compile(r'href=["\']([^"\']+)["\']'),
    re.compile(r'href=\{["\']([^"\']+)["\']\}'),
    re.compile(r'\burl=["\']([^"\']+)["\']'),
    re.compile(r'\bhref:\s*["\']([^"\']+)["\']'),
    re.compile(r'\burl:\s*["\']([^"\']+)["\']'),
    re.compile(r'\bpath:\s*["\']([^"\']+)["\']'),
    re.compile(r'\bto:\s*["\']([^"\']+)["\']'),
    re.compile(r'\bcanonical\s*=\s*["\']([^"\']+)["\']'),
]

# Strip absolute-URL prefix (canonical uses full URL form)
SITE_PREFIX = re.compile(r"^https?://(www\.)?samedayappliance\.repair")

stale_occurrences: list[tuple[str, str, str]] = []  # (file, stale_url, final_url)
files_with_stale: set[str] = set()
url_counter: Counter = Counter()
file_counter: Counter = Counter()

for path in SRC.rglob("*"):
    if not path.is_file():
        continue
    if path.suffix not in (".astro", ".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"):
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, PermissionError):
        continue

    rel = str(path.relative_to(ROOT)).replace("\\", "/")

    for pat in LINK_PATTERNS:
        for m in pat.finditer(text):
            raw_url = m.group(1)
            # Strip site prefix (handles canonical = "https://samedayappliance.repair/X/")
            stripped = SITE_PREFIX.sub("", raw_url)
            # Strip query/hash for matching
            clean = stripped.split("?")[0].split("#")[0]
            # Skip external + non-relative + non-path
            if (
                clean.startswith("http")
                or clean.startswith("mailto:")
                or clean.startswith("tel:")
                or clean.startswith("data:")
                or clean.startswith("javascript:")
                or not clean.startswith("/")
            ):
                continue
            # Try exact match first
            target = None
            matched_key = None
            if clean in redirect_keys:
                matched_key = clean
                target = redirect_map[clean]
            else:
                # Try with/without trailing slash
                alt = clean.rstrip("/") + "/" if not clean.endswith("/") else clean.rstrip("/")
                if alt in redirect_keys:
                    matched_key = alt
                    target = redirect_map[alt]
            if target:
                # Compute exact replacement value, preserving site prefix if present
                if SITE_PREFIX.match(raw_url):
                    prefix_m = SITE_PREFIX.match(raw_url)
                    prefix = prefix_m.group(0)
                    final_value = prefix + target
                else:
                    final_value = target
                # Skip slash-normalization no-ops (raw == final)
                if final_value == raw_url:
                    continue
                stale_occurrences.append((rel, raw_url, final_value))
                files_with_stale.add(rel)
                url_counter[raw_url] += 1
                file_counter[rel] += 1

print(f"=== Wave 40 stale link audit ===")
print(f"Files with stale links: {len(files_with_stale)}")
print(f"Total stale link occurrences: {len(stale_occurrences)}")
print(f"Unique stale URLs found: {len(url_counter)}")
print()
print("=== Top 25 most-linked stale URLs ===")
for url, count in url_counter.most_common(25):
    final = redirect_map.get(url) or redirect_map.get(url.rstrip("/") + "/")
    print(f"  {count:>4}x {url}  -->  {final}")
print()
print("=== Top 30 files with most stale links ===")
for f, n in file_counter.most_common(30):
    print(f"  {n:>3} stale links: {f}")

# Save full list for sweep
out = ROOT / "audit-output" / "wave-40-stale-links.json"
out.write_text(
    json.dumps(
        [
            {"file": f, "stale": s, "final": t}
            for (f, s, t) in stale_occurrences
        ],
        indent=2,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)
print(f"\nSaved: audit-output/wave-40-stale-links.json")
