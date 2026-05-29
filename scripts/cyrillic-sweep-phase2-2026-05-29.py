#!/usr/bin/env python3
# Wave 70 P0 Phase 2 — Cyrillic contamination sweep, 9 earlier-wave brand pages
# (Wave 43/47/48/49 wine-cooler/brand cleanup). Same methodology as Phase 1
# (scripts/cyrillic-sweep-2026-05-29.py): vetted phrase+token map, Cyrillic-letter
# word-boundary, hard per-file assertion 0 Cyrillic remaining or abort without writing.
import re, sys, os

CYR = re.compile(r'[Ѐ-ӿ]')

FILES = [
    'src/pages/brands/american-range-repair.astro',
    'src/pages/brands/danby-wine-cooler.astro',
    'src/pages/brands/eurocave.astro',
    'src/pages/brands/lang.astro',
    'src/pages/brands/le-cache.astro',
    'src/pages/brands/perlick-outdoor-refrigerator-repair.astro',
    'src/pages/brands/summit-wine-cooler.astro',
    'src/pages/brands/vinotemp.astro',
    'src/pages/brands/wine-enthusiast-wine-cooler.astro',
]

PHRASES = []  # none needed for this set (verified single-token / capitalized only)

TOKENS = {
    # --- new tokens found in these 9 files (context-verified) ---
    "серьезный": "serious",
    "компонентов": "components",
    "техники": "technicians",
    "другими": "other",
    "между": "between",
    "когда": "when",
    "где": "where",
    "это": "this is",
    "аре": "are",       # English "are" mistyped in Cyrillic ("cellar rooms аре serious")
    "На": "On",         # capitalized, sentence-start
    "а": "a",           # English article
    # --- carried from Phase 1 map ---
    "ФИНАЛЬНАЯ": "FINAL", "включает": "includes", "заметно": "noticeably",
    "достаточно": "enough", "каждый": "every", "каждой": "every", "через": "through",
    "плюс": "plus", "зоны": "zones", "после": "after", "если": "if", "одном": "one",
    "или": "or", "для": "for", "под": "under", "без": "without", "год": "year",
    "как": "as", "от": "from", "на": "on", "не": "not", "но": "but", "и": "and",
    "с": "with", "к": "to", "в": "in",
    # --- wine-cooler vocabulary (precautionary, per task brief) ---
    "компрессор": "compressor", "охлаждение": "cooling", "испаритель": "evaporator",
    "конденсатор": "condenser", "термостат": "thermostat", "вентилятор": "fan",
    "температура": "temperature", "замена": "replacement", "ремонт": "repair",
    "хладагент": "refrigerant", "утечка": "leak", "производитель": "manufacturer",
    "модель": "model", "серия": "series", "бутылок": "bottles", "бутылки": "bottles",
    "бутылка": "bottle", "дверь": "door", "уплотнитель": "gasket", "стекло": "glass",
    "подсветка": "lighting", "освещение": "lighting", "зона": "zone", "зон": "zones",
    "охладитель": "cooler", "шкаф": "cabinet", "погреб": "cellar", "винный": "wine",
    "вино": "wine", "влажность": "humidity", "дренаж": "drainage", "дренажа": "drainage",
    "фильтр": "filter", "обслуживание": "service", "обслуживания": "service",
    "установка": "installation", "установки": "installation", "калибровка": "calibration",
    "калибровки": "calibration", "диагностика": "diagnostic", "диагностики": "diagnostic",
}

def boundary_re(tok):
    return re.compile(r'(?<![Ѐ-ӿ])' + re.escape(tok) + r'(?![Ѐ-ӿ])')

def main():
    token_items = sorted(TOKENS.items(), key=lambda kv: -len(kv[0]))
    compiled = [(boundary_re(t), repl, t) for t, repl in token_items]
    total = 0
    results = []
    failed = []
    for f in FILES:
        if not os.path.exists(f):
            failed.append((f, ["MISSING FILE"])); continue
        src = open(f, encoding="utf-8").read()
        new = src
        n = 0
        for ph, repl in PHRASES:
            c = new.count(ph)
            if c:
                new = new.replace(ph, repl); n += c
        for rx, repl, tok in compiled:
            new, c = rx.subn(repl, new)
            n += c
        if CYR.search(new):
            rem = sorted(set(re.findall(r'[Ѐ-ӿ]+', new)))
            failed.append((f, rem)); continue
        results.append((f, n, new))
        total += n
    if failed:
        print("ABORT — Cyrillic remained / problem (no files written):")
        for f, rem in failed:
            print(f"  {f}: {rem}")
        sys.exit(1)
    for f, n, new in results:
        open(f, "w", encoding="utf-8", newline="").write(new)
        print(f"{n:4d}  {f}")
    print(f"\nTotal replacements: {total} across {len(results)} files. All files: 0 Cyrillic remaining.")

if __name__ == "__main__":
    main()
