#!/usr/bin/env python3
"""Wave 43 — Audit unique contextual patterns around 'BBB A+' across the codebase.

Reads raw grep output, extracts +/- 30 chars context window around each
occurrence, groups by pattern, outputs unique-pattern summary.
"""
import re
from collections import Counter, defaultdict
from pathlib import Path

INVENTORY = Path('audit-results/bbb-a-plus-inventory-raw.txt')
OUT = Path('audit-results/bbb-a-plus-patterns-2026-05-07.txt')

WINDOW = 30  # chars on either side
TARGET = 'BBB A+'

# Buckets: short canonical patterns we expect
CANONICAL_PATTERNS = [
    'BBB A+ accredited',
    'BBB A+ Accredited Business',
    'BBB A+ rated',
    'BBB A+-rated',
    'BBB Rating: A+',
    'BBB A+ accreditation',
    '★ BBB A+',
    '<strong>BBB A+</strong>',
    '⭐ BBB A+',
    '✅ BBB A+',
]

def normalize_context(line, pos):
    start = max(0, pos - WINDOW)
    end = min(len(line), pos + len(TARGET) + WINDOW)
    return line[start:end].strip()

def classify(context):
    """Return canonical pattern that best matches this context, or 'OTHER:<context>'."""
    for p in CANONICAL_PATTERNS:
        if p in context:
            return p
    # If none of the canonical patterns matched, try short forms
    if 'BBB A+' in context:
        # extract short signature: 8 chars before + 8 after
        idx = context.find('BBB A+')
        sig_before = context[max(0, idx - 8):idx]
        sig_after = context[idx + 6:idx + 14]
        return f"OTHER: '{sig_before}|BBB A+|{sig_after}'"
    return 'UNCLASSIFIED'

pattern_counter = Counter()
pattern_examples = defaultdict(list)
file_counter = Counter()

lines = INVENTORY.read_text(encoding='utf-8', errors='replace').splitlines()

for line in lines:
    # grep -rn output: PATH:LINENO:content
    m = re.match(r'^(.+?):(\d+):(.*)$', line)
    if not m:
        continue
    filepath, lineno, content = m.group(1), m.group(2), m.group(3)
    file_counter[filepath] += 1
    # Find every occurrence of BBB A+ on this line
    pos = 0
    while True:
        idx = content.find(TARGET, pos)
        if idx == -1:
            break
        ctx = normalize_context(content, idx)
        pat = classify(ctx)
        pattern_counter[pat] += 1
        if len(pattern_examples[pat]) < 3:
            pattern_examples[pat].append(f"{filepath}:{lineno}  «{ctx}»")
        pos = idx + len(TARGET)

# Output report
report = []
report.append(f"# BBB A+ Pattern Audit — 2026-05-07\n")
report.append(f"Total occurrences: {sum(pattern_counter.values())}")
report.append(f"Files affected: {len(file_counter)}")
report.append(f"Lines with at least one match: {len(lines)}\n")

report.append("## Patterns by frequency (canonical first, then OTHER)\n")
canonical_seen = []
other_seen = []
for pat, n in pattern_counter.most_common():
    bucket = canonical_seen if pat in CANONICAL_PATTERNS else other_seen
    bucket.append((pat, n))

for pat, n in canonical_seen:
    report.append(f"### {pat}  →  {n} occurrence(s)")
    for ex in pattern_examples[pat]:
        report.append(f"  - {ex}")
    report.append("")

if other_seen:
    report.append("## ⚠ OTHER patterns (not in canonical list — review needed)\n")
    for pat, n in other_seen:
        report.append(f"### {pat}  →  {n} occurrence(s)")
        for ex in pattern_examples[pat]:
            report.append(f"  - {ex}")
        report.append("")

report.append("\n## Top 20 files by occurrence count\n")
for fp, n in file_counter.most_common(20):
    report.append(f"  {n:3d}  {fp}")

OUT.write_text("\n".join(report), encoding='utf-8')
print(f"Wrote: {OUT}")
print(f"Total occurrences: {sum(pattern_counter.values())}")
print(f"Files affected: {len(file_counter)}")
print(f"Canonical patterns matched: {sum(n for _, n in canonical_seen)}")
print(f"OTHER (unclassified) patterns: {sum(n for _, n in other_seen)}")
print()
print("Top patterns:")
for pat, n in pattern_counter.most_common(15):
    flag = '' if pat in CANONICAL_PATTERNS else '  ⚠'
    print(f"  {n:4d}  {pat}{flag}")
