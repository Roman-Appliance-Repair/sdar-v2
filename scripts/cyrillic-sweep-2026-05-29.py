#!/usr/bin/env python3
# Wave 70 P0 — Cyrillic contamination sweep (batches 27-31 cleanup).
# Replaces Cyrillic connector tokens leaked into English AI-First prose with
# vetted English equivalents. Phrase-level fixes first, then word-boundary tokens.
# Hard assertion: 0 Cyrillic remaining per file, else abort without writing.
import re, glob, sys, os

CYR = re.compile(r'[Ѐ-ӿ]')

# Phrase replacements — applied first, order = specificity (longest/contextual first).
PHRASES = [
    ("всю leaked oil требуется containerize", "all leaked oil must be containerized"),
    ("при необходимости", "if needed"),
    ("при machine idle", "with the machine idle"),
    ("при $120 commercial diagnostic", "during the $120 commercial diagnostic"),
    ("к каждой", "to every"),
    ("на каждый", "on every"),
]

# Single-token map (Cyrillic-letter boundary, case as-is). Sorted longest-first below.
TOKENS = {
    "ФИНАЛЬНАЯ": "FINAL",
    "включает": "includes",
    "заметно": "noticeably",
    "достаточно": "enough",
    "каждый": "every",
    "каждой": "every",
    "через": "through",
    "плюс": "plus",
    "зоны": "zones",
    "после": "after",
    "если": "if",
    "одном": "one",
    "или": "or",
    "для": "for",
    "под": "under",
    "без": "without",
    "год": "year",
    "как": "as",
    "от": "from",
    "на": "on",
    "не": "not",
    "но": "but",
    "и": "and",
    "с": "with",
    "к": "to",
    "в": "in",
}

def boundary_re(tok):
    # token not preceded/followed by another Cyrillic letter (protects substrings)
    return re.compile(r'(?<![Ѐ-ӿ])' + re.escape(tok) + r'(?![Ѐ-ӿ])')

def collect_files():
    files = sorted(set(f for f in glob.glob("src/pages/commercial/**/*.astro", recursive=True)
                       if CYR.search(open(f, encoding="utf-8").read())))
    brand = ["src/pages/brands/vulcan.astro", "src/pages/brands/vulcan-fryer-repair.astro",
             "src/pages/brands/vulcan-range-repair.astro", "src/pages/brands/hobart.astro",
             "src/pages/brands/hobart-dishwasher-repair.astro",
             "src/pages/brands/jackson-dishwasher-repair.astro"]
    for b in brand:
        if os.path.exists(b) and CYR.search(open(b, encoding="utf-8").read()):
            files.append(b)
    return files

def main():
    files = collect_files()
    token_items = sorted(TOKENS.items(), key=lambda kv: -len(kv[0]))
    compiled = [(boundary_re(t), repl, t) for t, repl in token_items]
    total = 0
    results = []
    failed = []
    for f in files:
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
        leftover = CYR.findall(new)
        if leftover:
            # find remaining unique tokens for the report
            rem = sorted(set(re.findall(r'[Ѐ-ӿ]+', new)))
            failed.append((f, rem))
            continue
        results.append((f, n))
        total += n
        if not failed:  # only write if no failure anywhere yet (defer actual write)
            pass
        # stage in-memory; write after full pass below
        results[-1] = (f, n, new)
    if failed:
        print("ABORT — Cyrillic remained (no files written):")
        for f, rem in failed:
            print(f"  {f}: {rem}")
        sys.exit(1)
    # all clean — write
    for f, n, new in results:
        open(f, "w", encoding="utf-8", newline="").write(new)
        print(f"{n:4d}  {f}")
    print(f"\nTotal replacements: {total} across {len(results)} files. All files: 0 Cyrillic remaining.")

if __name__ == "__main__":
    main()
