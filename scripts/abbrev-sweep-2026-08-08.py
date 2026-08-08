# -*- coding: utf-8 -*-
"""Abbreviation purge sweep (Roman's rule FINAL, 2026-08-08).

Expands city/region abbreviations to full names in VISIBLE text only.
Guards:
  - skips *.legacy files (not built)
  - skips comment lines (// | * | /* | <!-- | {/*)
  - skips testimonial/quote lines (`text:` / `quote:` keys) — quotes are untouchable
  - skips brands/…delfield (SB = salad-bar product series)
  - IE replaced only when it is the Inland Empire, never the LG error code
  - 2-letter tokens guarded against slug/hyphen/slash/dot adjacency
LA / OC single tokens are NOT swept (Wave 39 title policy conflict) except
inside curated list patterns below. Reported separately.
"""
import re, sys, io
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
SRC = ROOT / "src"

COMMENT_RE = re.compile(r"^\s*(//|\*|/\*|<!--|\{\s*/\*)")
QUOTE_RE = re.compile(r"\b(text|quote)\s*:")

# Ordered: multi-token list patterns first, then single tokens.
LIST_PATTERNS = [
    (re.compile(r"across LA, OC, Ventura, SB, Riverside"),
     "across 7 Southern California counties"),
    (re.compile(r"Same-day LA, OC, Ventura, SB, Riverside\."),
     "Same-day across 7 Southern California counties."),
    (re.compile(r"LA · OC · Ventura · SB · Riverside"),
     "7 Counties Across Southern California"),
    (re.compile(r"across LA, OC, Ventura, IE\."),
     "across Los Angeles, Orange County, Ventura, and the Inland Empire."),
    (re.compile(r"across LA, OC, Ventura, and parts of SB"),
     "across most of Los Angeles, Orange County, Ventura, and parts of San Bernardino"),
    (re.compile(r"across most of LA, OC, Ventura, and parts of SB"),
     "across most of Los Angeles, Orange County, Ventura, and parts of San Bernardino"),
    (re.compile(r"\(LA, Ventura, parts of Orange and SB\)"),
     "(Los Angeles, Ventura, parts of Orange and San Bernardino)"),
    (re.compile(r"LA to San Diego"), "Los Angeles to San Diego"),
]

GUARD = r"(?<![\w/.-]){}(?![\w/.-])"
TOKEN_PATTERNS = [
    (re.compile(r"\bSoCal\b"), "Southern California", None),
    (re.compile(GUARD.format("SOCAL")), "SOUTHERN CALIFORNIA", None),
    (re.compile(r"\bWeHo\b"), "West Hollywood", None),
    (re.compile(GUARD.format("SGV")), "San Gabriel Valley", None),
    (re.compile(GUARD.format("BH")), "Beverly Hills", None),
    (re.compile(GUARD.format("SB")), "San Bernardino", "sb"),
    (re.compile(GUARD.format("IE")), "Inland Empire", "ie"),
]

# IE line must NOT look like an LG/washer error-code context.
IE_BLOCK = re.compile(r"error|code|inlet|valve|fill|Impinger|\bOE\b|\bFE\b|\bUE\b|\b4C\b|F8E1|E10|E13", re.I)
IE_FILE_BLOCK = re.compile(r"error-codes|lg-|whirlpool\.astro$")
SB_FILE_BLOCK = re.compile(r"delfield")

# Post-fixes: bare region noun needs "the".
POST_FIXES = [
    (re.compile(r"\bin Inland Empire than\b"), "in the Inland Empire than"),
    (re.compile(r"\bmost Inland Empire cities\b"), "most Inland Empire cities"),
]

changed_files = {}
log = []

files = [p for p in SRC.rglob("*") if p.suffix in (".astro", ".ts")
         and ".legacy" not in p.name and p.is_file()]

for f in files:
    rel = f.relative_to(ROOT).as_posix()
    try:
        text = f.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    lines = text.split("\n")
    out = []
    file_changed = False
    for i, line in enumerate(lines, 1):
        if COMMENT_RE.match(line) or QUOTE_RE.search(line):
            out.append(line)
            continue
        new = line
        for pat, rep in LIST_PATTERNS:
            if pat.search(new):
                new = pat.sub(rep, new)
        for pat, rep, kind in TOKEN_PATTERNS:
            if not pat.search(new):
                continue
            if kind == "ie":
                if IE_FILE_BLOCK.search(f.name) or IE_BLOCK.search(new):
                    log.append(f"SKIP-IE {rel}:{i}: {new.strip()[:120]}")
                    continue
            if kind == "sb" and SB_FILE_BLOCK.search(f.name):
                log.append(f"SKIP-SB {rel}:{i}: {new.strip()[:120]}")
                continue
            new = pat.sub(rep, new)
        for pat, rep in POST_FIXES:
            new = pat.sub(rep, new)
        if new != line:
            file_changed = True
            log.append(f"EDIT {rel}:{i}\n  - {line.strip()[:140]}\n  + {new.strip()[:140]}")
        out.append(new)
    if file_changed:
        f.write_text("\n".join(out), encoding="utf-8")
        changed_files[rel] = True

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
print(f"CHANGED FILES: {len(changed_files)}")
(ROOT / "audit-output" / "abbrev-sweep-log.txt").write_text("\n".join(log), encoding="utf-8")
print("Log: audit-output/abbrev-sweep-log.txt")
edits = sum(1 for l in log if l.startswith('EDIT'))
skips = sum(1 for l in log if l.startswith('SKIP'))
print(f"EDIT lines: {edits}  SKIP lines: {skips}")
