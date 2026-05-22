"""Wave 36 hours sweep — visible UI + schema OpeningHoursSpecification.

Two passes:
  1. Visible UI: stale display strings -> canonical BUSINESS_HOURS.display
  2. Schema: inline OpeningHoursSpecification literals -> canonical OPENING_HOURS_SCHEMA

Skips src/data/business-hours.ts (the SSOT itself).
Does NOT collapse whitespace runs (regression-safe vs the Wave 35 incident).
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
SSOT_FILE = SRC / "data" / "business-hours.ts"

CANONICAL_DISPLAY = "Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7"

# ---- Visible UI replacements ----
# Order matters: longer/more-specific patterns first so they don't get
# clobbered by shorter rules.
VISIBLE_REPLACEMENTS = [
    # 8am-7pm + Sunday 9am-5pm sentence forms
    (re.compile(r"8am[–—\-]7pm[ ]+and[ ]+Sunday[ ]+9am[–—\-]5pm\.?"),
     CANONICAL_DISPLAY + "."),
    (re.compile(r"8am[–—\-]7pm,[ ]+Sunday[ ]+9am[–—\-]5pm\.?"),
     CANONICAL_DISPLAY + "."),
    (re.compile(r"8am[–—\-]7pm[ ·]+Sun(?:day)?[ ]+9am[–—\-]5pm"),
     CANONICAL_DISPLAY),
    # 8am-8pm but missing the "Sun closed" segment
    (re.compile(r"8am[–—\-]8pm[ ·]+Phones?[ ]+answered[ ]+24/7"),
     CANONICAL_DISPLAY),
    (re.compile(r"8am[–—\-]8pm[ ·]+24/7[ ]+phone[ ]+answering"),
     CANONICAL_DISPLAY),
]

# ---- Schema replacements ----
# Capture the full openingHoursSpecification array contents (multi-line).
# Replacement preserves the JSON-LD context — works whether wrapped in
# `"openingHoursSpecification":` (JSON-LD/string-keys) or `openingHoursSpecification:`
# (JS object literal). We rebuild only the array contents.
SCHEMA_PATTERN_DOUBLE = re.compile(
    r'"openingHoursSpecification"\s*:\s*\[(.*?)\](?=\s*[,}\]])',
    re.DOTALL,
)
SCHEMA_PATTERN_BARE = re.compile(
    r'(?<![\'"\w])openingHoursSpecification\s*:\s*\[(.*?)\](?=\s*[,}\]])',
    re.DOTALL,
)

# Canonical replacement BLOCK (inner contents of the array)
CANONICAL_INNER = (
    '\n        { "@type": "OpeningHoursSpecification", '
    '"dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], '
    '"opens": "08:00", "closes": "20:00" },\n'
    '        { "@type": "OpeningHoursSpecification", '
    '"dayOfWeek": "Sunday", '
    '"opens": "00:00", "closes": "00:00" }\n      '
)

# Canonical fingerprint to detect already-canonical blocks (whitespace-insensitive)
def is_canonical(inner: str) -> bool:
    norm = re.sub(r"\s+", "", inner)
    has_main = '"dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"opens":"08:00","closes":"20:00"' in norm
    has_sun = '"dayOfWeek":"Sunday","opens":"00:00","closes":"00:00"' in norm
    # Reject if it ALSO contains stale entries (e.g. Mon-Fri 07:00-21:00)
    has_stale = (
        '"opens":"07:00"' in norm
        or '"opens":"09:00"' in norm
        or '"closes":"19:00"' in norm
        or '"closes":"21:00"' in norm
        or '"closes":"17:00"' in norm
        or '"closes":"23:59"' in norm
    )
    return has_main and has_sun and not has_stale


def make_replace(stats):
    def replace(match):
        inner = match.group(1)
        if is_canonical(inner):
            stats["skipped"] += 1
            return match.group(0)
        # Determine quote style for "openingHoursSpecification" key
        full = match.group(0)
        if full.lstrip().startswith('"openingHoursSpecification"'):
            return f'"openingHoursSpecification": [{CANONICAL_INNER}]'
        else:
            # bare key form (JS object literal — no surrounding quotes on key)
            return f'openingHoursSpecification: [{CANONICAL_INNER}]'
    return replace


# ---- Drivers ----
def sweep_visible():
    changed = []
    for path in SRC.rglob("*"):
        if path.suffix not in (".astro", ".ts", ".tsx", ".md"):
            continue
        if path.resolve() == SSOT_FILE.resolve():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        original = text
        for pat, repl in VISIBLE_REPLACEMENTS:
            text = pat.sub(repl, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    return changed


def sweep_schema():
    stats = {"skipped": 0}
    changed = []
    for path in SRC.rglob("*"):
        if path.suffix not in (".astro", ".ts", ".tsx"):
            continue
        if path.resolve() == SSOT_FILE.resolve():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        original = text
        replace = make_replace(stats)
        text = SCHEMA_PATTERN_DOUBLE.sub(replace, text)
        text = SCHEMA_PATTERN_BARE.sub(replace, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    return changed, stats["skipped"]


def main():
    print("=== Visible UI sweep ===")
    visible_changed = sweep_visible()
    print(f"  files updated: {len(visible_changed)}")
    for f in visible_changed[:30]:
        print(f"    {f}")

    print()
    print("=== Schema sweep ===")
    schema_changed, skipped = sweep_schema()
    print(f"  files updated: {len(schema_changed)}, blocks already canonical (skipped): {skipped}")
    for f in schema_changed[:40]:
        print(f"    {f}")
    if len(schema_changed) > 40:
        print(f"    ... and {len(schema_changed) - 40} more")


if __name__ == "__main__":
    main()
