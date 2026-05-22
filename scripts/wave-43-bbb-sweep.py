#!/usr/bin/env python3
"""Wave 43 — BBB A+ → BBB Accredited site-wide sweep.

Replace map (длинные patterns first, catch-all last):
  1. 'BBB A+ Accredited Business' → 'BBB Accredited Business'  (idempotent guard)
  2. 'BBB A+ accredited'          → 'BBB Accredited Business'
  3. 'BBB A+ Accredited'          → 'BBB Accredited Business'
  4. 'BBB A+ accreditation'       → 'BBB Accreditation'
  5. 'BBB A+ Rating'              → 'BBB Accredited Business'
  6. 'BBB A+ rated'               → 'BBB Accredited'
  7. 'BBB A+-rated'               → 'BBB Accredited'
  8. 'BBB Rating: A+'             → 'BBB Accredited Business'
  9. 'BBB A+'                     → 'BBB Accredited'  (catch-all)

Scope:
  src/pages/, src/components/, src/layouts/, src/data/, src/utils/
  extensions: .astro .ts .tsx .json
  exclude: *.legacy *.bak

Output:
  audit-results/wave-43-bbb-sweep-log.txt
"""

import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIRS = ['src/pages', 'src/components', 'src/layouts', 'src/data', 'src/utils']
EXTS = {'.astro', '.ts', '.tsx', '.json'}
EXCLUDE_SUFFIXES = ('.legacy', '.bak')

REPLACE_MAP = [
    ('BBB A+ Accredited Business', 'BBB Accredited Business'),
    ('BBB A+ accredited',          'BBB Accredited Business'),
    ('BBB A+ Accredited',          'BBB Accredited Business'),
    ('BBB A+ accreditation',       'BBB Accreditation'),
    ('BBB A+ Rating',              'BBB Accredited Business'),
    ('BBB A+ rated',               'BBB Accredited'),
    ('BBB A+-rated',               'BBB Accredited'),
    ('BBB Rating: A+',             'BBB Accredited Business'),
    ('BBB A+',                     'BBB Accredited'),
]

DRY_RUN = '--dry-run' in sys.argv

def collect_files():
    files = []
    for d in SRC_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in base.rglob('*'):
            if not p.is_file():
                continue
            if p.suffix not in EXTS:
                continue
            if any(str(p).endswith(suf) for suf in EXCLUDE_SUFFIXES):
                continue
            files.append(p)
    return files

def sweep_file(path):
    """Returns (changes_per_pattern_dict, total_changes_in_file)."""
    text = path.read_text(encoding='utf-8')
    original = text
    per_pattern = Counter()
    for old, new in REPLACE_MAP:
        cnt = text.count(old)
        if cnt:
            text = text.replace(old, new)
            per_pattern[old] = cnt
    if text != original:
        if not DRY_RUN:
            path.write_text(text, encoding='utf-8', newline='\n')
        return per_pattern, sum(per_pattern.values())
    return per_pattern, 0

def main():
    files = collect_files()
    total_files_modified = 0
    total_replacements = 0
    pattern_totals = Counter()
    files_modified = []

    for f in files:
        per_pat, total = sweep_file(f)
        if total > 0:
            total_files_modified += 1
            total_replacements += total
            pattern_totals.update(per_pat)
            files_modified.append((f, total, per_pat))

    # Write log
    log_path = ROOT / 'audit-results' / 'wave-43-bbb-sweep-log.txt'
    log_path.parent.mkdir(exist_ok=True)
    lines = []
    lines.append(f"# Wave 43 BBB A+ Sweep Log — {'DRY RUN' if DRY_RUN else 'APPLIED'}")
    lines.append(f"")
    lines.append(f"Files scanned:        {len(files)}")
    lines.append(f"Files modified:       {total_files_modified}")
    lines.append(f"Total replacements:   {total_replacements}")
    lines.append(f"")
    lines.append(f"## Pattern application count")
    for old, new in REPLACE_MAP:
        n = pattern_totals.get(old, 0)
        lines.append(f"  {n:5d}  '{old}' -> '{new}'")
    lines.append(f"")
    lines.append(f"## Files modified (count of replacements per file)")
    files_modified.sort(key=lambda x: -x[1])
    for path, total, per_pat in files_modified:
        rel = path.relative_to(ROOT).as_posix()
        lines.append(f"  {total:3d}  {rel}")
    log_path.write_text('\n'.join(lines), encoding='utf-8')

    # Stdout summary (ASCII only — Windows console safe)
    print(f"Files scanned:      {len(files)}")
    print(f"Files modified:     {total_files_modified}")
    print(f"Total replacements: {total_replacements}")
    print()
    print("Pattern application:")
    for old, new in REPLACE_MAP:
        n = pattern_totals.get(old, 0)
        print(f"  {n:5d}  '{old}' -> '{new}'")
    print()
    print(f"Log: {log_path.relative_to(ROOT).as_posix()}")
    if DRY_RUN:
        print("\n** DRY RUN — no files modified. Re-run without --dry-run to apply. **")

if __name__ == '__main__':
    main()
