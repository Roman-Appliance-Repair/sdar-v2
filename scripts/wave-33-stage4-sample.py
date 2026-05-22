"""Sample 30 random Stage 4 pages and report description lengths post-sweep."""
import random
import re
from pathlib import Path

random.seed(42)
files = []
for cat_dir in ["src/pages/brands", "src/pages/commercial", "src/pages/price-list", "src/pages/credentials"]:
    p = Path(cat_dir)
    if p.exists():
        files.extend(list(p.rglob("*.astro")))

sample = random.sample(files, 30)
print("=== Sample 30 random Stage 4 pages — descriptions post-sweep ===\n")

PATTERNS = [
    (r'const\s+description\s*=\s*"((?:[^"\\]|\\.)*?)"', '"'),
    (r"const\s+description\s*=\s*'((?:[^'\\]|\\.)*?)'", "'"),
    (r"const\s+description\s*=\s*`((?:[^`\\]|\\.)*?)`", "`"),
]

distribution = {"in_range": 0, "long": 0, "short": 0, "no_desc": 0}

for fp in sample:
    text = fp.read_text(encoding="utf-8")
    desc = None
    for pat, q in PATTERNS:
        m = re.search(pat, text, re.S)
        if m:
            desc = m.group(1).replace('\\"', '"').replace("\\'", "'")
            break
    if desc is None:
        distribution["no_desc"] += 1
        print(f"  [---] {fp.relative_to('src/pages')} (no const description)")
        continue
    n = len(desc)
    if n > 160:
        flag = "LONG"
        distribution["long"] += 1
    elif n < 100:
        flag = "SHORT"
        distribution["short"] += 1
    else:
        flag = "OK"
        distribution["in_range"] += 1
    print(f"  [{n:>3} {flag:<5}] {fp.relative_to('src/pages')}")
    print(f"        {desc[:130]}{'...' if len(desc) > 130 else ''}")

print(f"\nDistribution: in_range={distribution['in_range']}, long={distribution['long']}, short={distribution['short']}")
