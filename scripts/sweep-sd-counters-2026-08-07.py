# sweep-sd-counters-2026-08-07.py — 7th-county counter sweep (feat/san-diego).
# Same pattern as sweep-sb-counters-2026-08-06.py (Stage D): exact-string
# character-level replacements ONLY (no regex, no whitespace normalization),
# ordered longest-first so compound strings win. JSON-LD and comments are safe
# because dated/historical phrasings ("93 city pillars", "9 patterns") don't
# match the exact counter strings below.
# Usage: python scripts/sweep-sd-counters-2026-08-07.py [--apply]
import os, sys, io, collections

APPLY = '--apply' in sys.argv

REPLACEMENTS = [
    ("Six counties · 9 service territories · 93 cities",
     "Seven counties · 10 service territories · 99 cities"),
    ("Nine service territories", "Ten service territories"),
    ("nine service territories", "ten service territories"),
    ("9 service territories", "10 service territories"),
    ("all 9 branches", "all 10 branches"),
    ("9 BRANCHES", "10 BRANCHES"),
    ("9 branches", "10 branches"),
    ("Nine branches", "Ten branches"),
    ("nine branches", "ten branches"),
    ("93 Cities", "99 Cities"),
    ("93 cities", "99 cities"),
    ("Six-county", "Seven-county"),
    ("six-county", "seven-county"),
    ("Six counties", "Seven counties"),
    ("six counties", "seven counties"),
    ("6 counties", "7 counties"),
    # County enumerations — geographic order ends ... Riverside, San Diego.
    ("Santa Barbara, San Bernardino, and Riverside",
     "Santa Barbara, San Bernardino, Riverside, and San Diego"),
    ("San Bernardino, and Riverside counties",
     "San Bernardino, Riverside, and San Diego counties"),
    ("San Bernardino and Riverside counties",
     "San Bernardino, Riverside, and San Diego counties"),
    # Branch enumeration tail (Stage D form).
    ("Rancho Cucamonga, Riverside, and Santa Barbara",
     "Rancho Cucamonga, Riverside, Santa Barbara, and San Diego"),
    ("Orange, Ventura &amp; Santa Barbara counties",
     "Orange, Ventura, Santa Barbara &amp; San Diego counties"),
]

EXCLUDE_FILES = {
    os.path.normpath('src/components/TrustBar.astro'),      # SSOT-dynamic ticker
    os.path.normpath('src/pages/index.astro'),              # SSOT-dynamic counts
    os.path.normpath('src/data/faq.ts'),                    # SSOT-dynamic answer
    os.path.normpath('src/data/city-service-content.ts'),   # LA-county "87 neighborhoods" etc.
}

ROOTS = ['src']
EXT = ('.astro', '.ts', '.tsx', '.js', '.jsx')

per_pattern = collections.Counter()
per_file = {}
inventory = []

for root in ROOTS:
    for dirpath, _, files in os.walk(root):
        for fn in files:
            if not fn.endswith(EXT) or fn.endswith('.legacy'):
                continue
            p = os.path.normpath(os.path.join(dirpath, fn))
            if p in EXCLUDE_FILES:
                continue
            with io.open(p, encoding='utf-8') as f:
                text = f.read()
            orig = text
            file_hits = 0
            for old, new in REPLACEMENTS:
                n = text.count(old)
                if n:
                    for i, line in enumerate(text.split('\n'), 1):
                        if old in line:
                            inventory.append((p, i, old))
                    per_pattern[old] += n
                    file_hits += n
                    text = text.replace(old, new)
            if file_hits:
                per_file[p] = file_hits
                if APPLY and text != orig:
                    with io.open(p, 'w', encoding='utf-8', newline='') as f:
                        f.write(text)

mode = 'APPLIED' if APPLY else 'DRY-RUN'
print(f'== {mode} ==')
print(f'files touched: {len(per_file)}, total replacements: {sum(per_pattern.values())}')
print('\n-- per pattern --')
for old, new in REPLACEMENTS:
    if per_pattern[old]:
        print(f'{per_pattern[old]:5d}  "{old}" -> "{new}"')
print('\n-- top files --')
for p, n in sorted(per_file.items(), key=lambda x: -x[1])[:15]:
    print(f'{n:5d}  {p}')
if not APPLY:
    out = os.environ.get('SWEEP_INVENTORY', 'sweep-sd-inventory.txt')
    with io.open(out, 'w', encoding='utf-8') as f:
        for p, i, old in inventory:
            f.write(f'{p}:{i}: {old}\n')
    print(f'\nfull inventory written to {out}')
