"""Inspect actual long titles to find the real cause of length."""
import re
from pathlib import Path

ROOT = Path("src/pages")
TITLE_PATTERNS = [
    re.compile(r"<title>([^<]+)</title>"),
    re.compile(r'^title:\s*["\']([^"\'\n]+)["\']', re.MULTILINE),
    re.compile(r'const\s+title\s*=\s*["`]([^"`\n]+)["`]'),
]
PHONE = re.compile(r"\(\d{3}\)\s*\d{3}[-\s]?\d{4}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}|\+?1?\d{10}")

samples = []
for path in ROOT.rglob("*.astro"):
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue
    for pat in TITLE_PATTERNS:
        m = pat.search(text)
        if m:
            t = m.group(1).strip()
            if len(t) > 60:
                samples.append((str(path).replace("\\", "/"), len(t), t))
                break

samples.sort(key=lambda x: -x[1])

print(f"Total titles >60: {len(samples)}")
print()
print("=== Top 20 longest ===")
for path, L, t in samples[:20]:
    has_phone = bool(PHONE.search(t))
    print(f"  [{L}] phone={has_phone}  {path}")
    print(f"      {t}")
print()
print("=== Sample 10 in 80-110 range ===")
mid = [s for s in samples if 80 <= s[1] <= 110]
for path, L, t in mid[:10]:
    print(f"  [{L}] {path}")
    print(f"      {t}")
print()
print("=== Common ending patterns (SUFFIXES after last separator) ===")
suffix_count = {}
for _, _, t in samples:
    for sep in [" | ", " — ", " · "]:
        if sep in t:
            suffix = t.rsplit(sep, 1)[-1]
            suffix_count[suffix] = suffix_count.get(suffix, 0) + 1
            break
for suffix, n in sorted(suffix_count.items(), key=lambda x: -x[1])[:15]:
    print(f"  [{n}] '{suffix}'")
