"""NAP sweep — 2026-05-06.

Removes from src/ pages and components:
  - Old PMB address strings (6230 Wilshire / PMB 2267)
  - CSLB C-20 references (this is not an HVAC site)
  - Mislabeled credentials:
      'BHGS Licensed #A49573'  -> 'BHGS #A49573'
      'CA BHGS #A49573'        -> 'BHGS #A49573'
      'BHGS License #A49573'   -> 'BHGS Registration #A49573'
      'License #A49573' (when not paired with BHGS already) -> 'Registration #A49573'

Preserves WeHo's `8746 Rangely Ave` (the only public physical address).
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"

# ---- Step 4: old PMB address removal ----
OLD_ADDRESS_FRAGMENTS = [
    # JSON-LD streetAddress entries with the old PMB
    (re.compile(r'"streetAddress"\s*:\s*"6230 Wilshire[^"]*"\s*,?'), ""),
    (re.compile(r'"streetAddress"\s*:\s*"[^"]*PMB 2267[^"]*"\s*,?'), ""),
    # Same in single-quoted JS object form
    (re.compile(r"streetAddress\s*:\s*'6230 Wilshire[^']*'\s*,?"), ""),
    (re.compile(r"streetAddress\s*:\s*'[^']*PMB 2267[^']*'\s*,?"), ""),
    # Bare textual mentions in prose / hardcoded HTML
    (re.compile(r"\b6230 Wilshire Blvd,?\s*Ste A\s*,?\s*PMB 2267,?\s*Los Angeles,?\s*CA,?\s*90048\b"), ""),
    (re.compile(r"\b6230 Wilshire Blvd,?\s*Ste A\s*,?\s*PMB 2267\b"), ""),
    (re.compile(r"\b6230 Wilshire Blvd Ste A PMB 2267\b"), ""),
    (re.compile(r"\b6230 Wilshire\b"), ""),
    (re.compile(r"\bPMB 2267\b"), ""),
]

# ---- Step 5: CSLB C-20 removal ----
CSLB_C20_PATTERNS = [
    # HTML element wrapping CSLB C-20 (full element)
    (re.compile(r"<li[^>]*>\s*<strong>\s*CSLB C-?20\s*</strong>\s*<span[^>]*>[^<]*</span>\s*</li>"), ""),
    (re.compile(r"<div[^>]*>\s*<strong>\s*CSLB C-?20\s*</strong>\s*<span[^>]*>[^<]*</span>\s*</div>"), ""),
    # JSON-LD or string '"CSLB C-20 ..."' values
    (re.compile(r'"[Cc]redential"\s*:\s*"CSLB C-?20[^"]*"\s*,?'), ""),
    (re.compile(r"'CSLB C-?20[^']*'\s*,?"), "''"),
    # Bare textual " plus CSLB C-20 HVAC" connector phrases
    (re.compile(r"\s+plus CSLB C-?20 HVAC\b"), ""),
    (re.compile(r"\s+\+\s*CSLB C-?20\s*HVAC\b"), ""),
    (re.compile(r"\bCSLB C-?20 HVAC\b"), ""),
    (re.compile(r"\bCSLB C-?20\b"), ""),
]

# ---- Step 6: BHGS labeling unification ----
BHGS_LABEL_PATTERNS = [
    # "BHGS Licensed #A49573" -> "BHGS #A49573" (168 files)
    (re.compile(r"\bBHGS Licensed #A49573\b"), "BHGS #A49573"),
    # "CA BHGS #A49573" -> "BHGS #A49573" (87 files)
    (re.compile(r"\bCA BHGS #A49573\b"), "BHGS #A49573"),
    # "BHGS License #A49573" -> "BHGS Registration #A49573"
    (re.compile(r"\bBHGS License #A49573\b"), "BHGS Registration #A49573"),
    # Footer-style standalone "License #A49573" (no BHGS prefix in same span)
    # Replace conservatively: only when "License #A49573" is a complete content
    # of a span/li/strong, not embedded in arbitrary prose.
    (re.compile(r"<span([^>]*)>License #A49573</span>"), r"<span\1>Registration #A49573</span>"),
]


def apply_passes(text: str, passes) -> str:
    for pat, repl in passes:
        text = pat.sub(repl, text)
    return text


def cleanup(text: str) -> str:
    """JSON-LD comma cleanup after removed fields. PRESERVES indentation."""
    # Multiple commas -> single (only when not separated by indentation newline)
    text = re.sub(r",[ \t]*,+", ",", text)
    # Comma before closing brace/bracket (allow newlines + indent between)
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    # Opening brace followed by comma
    text = re.sub(r"(\{[ \t]*),", r"\1", text)
    # NOTE: do NOT collapse runs of spaces — that destroys indentation.
    return text


def main():
    targets = [p for p in SRC.rglob("*") if p.suffix in (".astro", ".ts", ".tsx", ".js", ".jsx") and p.is_file()]
    counts = {"address": 0, "cslb": 0, "bhgs_label": 0, "any": 0}
    for path in targets:
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        original = text

        a = apply_passes(text, OLD_ADDRESS_FRAGMENTS)
        if a != text:
            counts["address"] += 1
        text = a

        b = apply_passes(text, CSLB_C20_PATTERNS)
        if b != text:
            counts["cslb"] += 1
        text = b

        c = apply_passes(text, BHGS_LABEL_PATTERNS)
        if c != text:
            counts["bhgs_label"] += 1
        text = c

        text = cleanup(text)

        if text != original:
            path.write_text(text, encoding="utf-8")
            counts["any"] += 1

    print(f"Files modified: {counts['any']}")
    print(f"  - old PMB address removed: {counts['address']}")
    print(f"  - CSLB C-20 removed:       {counts['cslb']}")
    print(f"  - BHGS labels unified:     {counts['bhgs_label']}")


if __name__ == "__main__":
    main()
