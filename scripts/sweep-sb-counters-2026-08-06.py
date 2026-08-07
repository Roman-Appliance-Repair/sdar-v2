# sweep-sb-counters-2026-08-06.py — Stage D counter sweep (feat/santa-barbara).
# Methodology §4: exact-string character-level replacements ONLY (no regex, no
# whitespace normalization), ordered longest-first so compound strings win.
# Historical/dated comments survive automatically: patterns match "87 cities"
# but not "87 city pillars" / "87 .astro files" / "87 neighborhoods".
# Usage: python scripts/sweep-sb-counters-2026-08-06.py [--apply]
import os, sys, io, collections

APPLY = '--apply' in sys.argv

# Ordered: compound first, then specific, then generic.
REPLACEMENTS = [
    ("Five counties \u00b7 8 service territories \u00b7 87 cities",
     "Six counties \u00b7 9 service territories \u00b7 93 cities"),
    ("Eight service territories", "Nine service territories"),
    ("eight service territories", "nine service territories"),
    ("8 service territories", "9 service territories"),
    ("all 8 branches", "all 9 branches"),
    ("8 BRANCHES", "9 BRANCHES"),
    ("8 branches", "9 branches"),
    ("Eight branches", "Nine branches"),
    ("eight branches", "nine branches"),
    ("87+ cities", "93 cities"),
    ("87 Cities", "93 Cities"),
    ("87 cities", "93 cities"),
    ("Five-county", "Six-county"),
    ("five-county", "six-county"),
    ("Five counties", "Six counties"),
    ("five counties", "six counties"),
    ("5 counties", "6 counties"),
    ("Orange, Ventura, San Bernardino", "Orange, Ventura, Santa Barbara, San Bernardino"),
    # Branch enumerations: "…8/9 service territories, West Hollywood (HQ), …, Rancho
    # Cucamonga, and Temecula" — the tail is doubly stale (Temecula branch renamed
    # Riverside 2026-05-08, and the 9th branch is missing). One tail fix covers all.
    ("Rancho Cucamonga, and Temecula", "Rancho Cucamonga, Riverside, and Santa Barbara"),
    ("Orange &amp; Ventura counties", "Orange, Ventura &amp; Santa Barbara counties"),
]

# Files never touched by the script (manual/dynamic edits or protected content).
EXCLUDE_FILES = {
    os.path.normpath('src/components/TrustBar.astro'),      # manual: SSOT-dynamic ticker
    os.path.normpath('src/pages/index.astro'),              # manual: SSOT-dynamic counts
    os.path.normpath('src/data/faq.ts'),                    # manual: SSOT-dynamic answer
    os.path.normpath('src/data/city-service-content.ts'),   # "87 neighborhoods across LA County" ≠ site counter
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
                    # record line numbers from the CURRENT text before replacing
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
    with io.open('C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/97a32707-095b-4db5-bac9-10c1ba0cb391/scratchpad/sweep-inventory.txt', 'w', encoding='utf-8') as f:
        for p, i, old in inventory:
            f.write(f'{p}:{i}: {old}\n')
    print('\nfull inventory written to scratchpad/sweep-inventory.txt')
