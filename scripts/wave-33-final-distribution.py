"""Final 50-page random sample for description length distribution post-Wave-33."""
import re
import random
from pathlib import Path

random.seed(33)
all_files = list(Path("src/pages").rglob("*.astro"))
sample = random.sample(all_files, min(50, len(all_files)))

PATTERNS = [
    (r'const\s+description\s*=\s*"((?:[^"\\]|\\.)*?)"', '"'),
    (r"const\s+description\s*=\s*'((?:[^'\\]|\\.)*?)'", "'"),
    (r"const\s+description\s*=\s*`((?:[^`\\]|\\.)*?)`", "`"),
]
META_PATTERN = r'const\s+meta\s*=\s*\{[^}]*?description:\s*"((?:[^"\\]|\\.)*?)"'

lengths = []
no_desc = 0
for fp in sample:
    try:
        text = fp.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    desc = None
    for pat, q in PATTERNS:
        m = re.search(pat, text, re.S)
        if m:
            desc = m.group(1).replace('\\"', '"').replace("\\'", "'")
            break
    if desc is None:
        m = re.search(META_PATTERN, text, re.S)
        if m:
            desc = m.group(1).replace('\\"', '"')
    if desc:
        lengths.append(len(desc))
    else:
        no_desc += 1

if lengths:
    print(f"Sample size:        {len(lengths)} (no-desc skipped: {no_desc})")
    print(f"Min:                {min(lengths)}")
    print(f"Max:                {max(lengths)}")
    print(f"Mean:               {sum(lengths) / len(lengths):.0f}")
    print(f"Median:             {sorted(lengths)[len(lengths)//2]}")
    print(f"In 130-155 (ideal): {sum(1 for L in lengths if 130 <= L <= 155)}/{len(lengths)}")
    print(f"In 100-160 (OK):    {sum(1 for L in lengths if 100 <= L <= 160)}/{len(lengths)}")
    print(f"> 160 (truncated):  {sum(1 for L in lengths if L > 160)}/{len(lengths)}")
    print(f"< 100 (over-short): {sum(1 for L in lengths if L < 100)}/{len(lengths)}")
