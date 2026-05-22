"""Wave 36 hours sweep — v2 with bracket-depth tracking.

Fix vs v1: schema replacement uses character-by-character bracket walker
instead of non-greedy regex `[(.*?)\]`, which blew up on nested
`dayOfWeek: [...]` inner arrays.

Two passes:
  1. Visible UI: stale display strings -> canonical
  2. Schema: inline OpeningHoursSpecification arrays -> canonical (bracket-balanced)
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
SSOT_FILE = SRC / "data" / "business-hours.ts"

CANONICAL_DISPLAY = "Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7"

# ---- Visible UI ----
VISIBLE_REPLACEMENTS = [
    (re.compile(r"8am[–—\-]7pm[ ]+and[ ]+Sunday[ ]+9am[–—\-]5pm\.?"),
     CANONICAL_DISPLAY + "."),
    (re.compile(r"8am[–—\-]7pm,[ ]+Sunday[ ]+9am[–—\-]5pm\.?"),
     CANONICAL_DISPLAY + "."),
    (re.compile(r"8am[–—\-]7pm[ ·]+Sun(?:day)?[ ]+9am[–—\-]5pm"),
     CANONICAL_DISPLAY),
    (re.compile(r"8am[–—\-]8pm[ ·]+Phones?[ ]+answered[ ]+24/7"),
     CANONICAL_DISPLAY),
    (re.compile(r"8am[–—\-]8pm[ ·]+24/7[ ]+phone[ ]+answering"),
     CANONICAL_DISPLAY),
]

# ---- Schema ----
# Canonical inner content (between [ and ])
CANONICAL_INNER = (
    '\n        { "@type": "OpeningHoursSpecification", '
    '"dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], '
    '"opens": "08:00", "closes": "20:00" },\n'
    '        { "@type": "OpeningHoursSpecification", '
    '"dayOfWeek": "Sunday", '
    '"opens": "00:00", "closes": "00:00" }\n      '
)


def find_openingHoursSpec_arrays(text: str):
    """Yield (start_of_key, start_of_open_bracket, end_after_close_bracket, key_form)
    for each openingHoursSpecification array in text. Uses bracket-depth
    tracking to find the MATCHING outer ]."""
    # Match the key form (with or without quotes around the key)
    key_pattern = re.compile(
        r'("openingHoursSpecification"|(?<![\'"\w])openingHoursSpecification)'
        r'\s*:\s*\['
    )
    for m in key_pattern.finditer(text):
        key_form = m.group(1)
        start = m.start()
        bracket_pos = m.end() - 1  # the `[` character
        # Walk to find matching ]
        depth = 1
        i = bracket_pos + 1
        in_string = False
        string_quote = None
        while i < len(text) and depth > 0:
            c = text[i]
            if in_string:
                if c == "\\":
                    i += 2
                    continue
                if c == string_quote:
                    in_string = False
            else:
                if c == '"' or c == "'":
                    in_string = True
                    string_quote = c
                elif c == "[":
                    depth += 1
                elif c == "]":
                    depth -= 1
                    if depth == 0:
                        yield (start, bracket_pos, i + 1, key_form)
                        break
            i += 1


def is_canonical(inner: str) -> bool:
    """Inner content (between [ and ]) is canonical if it has Mon-Sat block + Sunday closed
    and no stale opens/closes patterns."""
    norm = re.sub(r"\s+", "", inner)
    has_main = (
        '"dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]'
        ',"opens":"08:00","closes":"20:00"'
    ) in norm
    has_sun = '"dayOfWeek":"Sunday","opens":"00:00","closes":"00:00"' in norm
    has_stale = (
        '"opens":"07:00"' in norm
        or '"opens":"09:00"' in norm
        or '"closes":"19:00"' in norm
        or '"closes":"21:00"' in norm
        or '"closes":"17:00"' in norm
        or '"closes":"23:59"' in norm
    )
    return has_main and has_sun and not has_stale


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
    changed = []
    skipped = 0
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
        # Process in reverse order so substitutions don't shift later indices
        spans = list(find_openingHoursSpec_arrays(text))
        if not spans:
            continue
        # Build replacement from end to start
        new_text = text
        for start, bracket_pos, end, key_form in reversed(spans):
            inner = new_text[bracket_pos + 1 : end - 1]
            if is_canonical(inner):
                skipped += 1
                continue
            # Replace the entire match span (key + : + [ ... ])
            replacement = f"{key_form}: [{CANONICAL_INNER}]"
            new_text = new_text[:start] + replacement + new_text[end:]
        if new_text != original:
            path.write_text(new_text, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    return changed, skipped


def main():
    print("=== Visible UI sweep ===")
    visible_changed = sweep_visible()
    print(f"  files updated: {len(visible_changed)}")
    for f in visible_changed[:30]:
        print(f"    {f}")

    print()
    print("=== Schema sweep (bracket-depth tracking) ===")
    schema_changed, skipped = sweep_schema()
    print(f"  files updated: {len(schema_changed)}, blocks already canonical (skipped): {skipped}")
    for f in schema_changed[:40]:
        print(f"    {f}")
    if len(schema_changed) > 40:
        print(f"    ... and {len(schema_changed) - 40} more")


if __name__ == "__main__":
    main()
