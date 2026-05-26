#!/usr/bin/env python3
"""Wave 57 - Blog post brand linkify.

Scans every .astro file under src/pages/blog/ (except index.astro) and replaces
the first plain-text mention of each brand with an inline link to the brand
pillar. Maximum 5 links per blog post. Skips mentions inside <a>, <code>, <pre>,
frontmatter (between '---' lines), and inline JSON-LD <script type=application/ld+json>.

Outdoor routing rules:
- Outdoor-only brands (Lynx, Alfresco, DCS, Twin Eagles, Fire Magic, Kalamazoo)
  always link to /outdoor/brands/{slug}/.
- For files in OUTDOOR_FILES, Wolf and Hestan are routed to /outdoor/brands/.
- Everything else routes to /brands/{slug}/.

Run from repo root: python scripts/wave-57-blog-linkify/apply.py
"""

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BLOG_DIR = REPO / "src" / "pages" / "blog"
MAX_LINKS_PER_POST = 5

OUTDOOR_FILES = {
    "top-5-outdoor-grill-brand-failures-la.astro",
}

OUTDOOR_ONLY_BRANDS = {"Lynx", "Alfresco", "DCS", "Twin Eagles", "Fire Magic", "Kalamazoo"}

# (display, regex pattern, slug). Order matters: multi-word/hyphenated first so
# they bind before single-word substrings have a chance to claim the position.
BRANDS = [
    ("Fisher & Paykel", r"Fisher\s*&\s*Paykel", "fisher-paykel"),
    ("Twin Eagles",     r"Twin\s+Eagles",       "twin-eagles"),
    ("Fire Magic",      r"Fire\s+Magic",        "fire-magic"),
    ("Beverage-Air",    r"Beverage-Air",        "beverage-air"),
    ("GE Cafe",         r"GE\s+Caf(?:e|é)", "ge-cafe"),
    ("GE Monogram",     r"GE\s+Monogram",       "ge-monogram"),
    ("GE Profile",      r"GE\s+Profile",        "ge-profile"),
    ("Sub-Zero",        r"Sub-Zero",            "sub-zero"),
    ("Jenn-Air",        r"Jenn-Air",            "jennair"),
    ("JennAir",         r"JennAir",             "jennair"),
    ("U-Line",          r"U-Line",              "u-line"),
    ("WhisperKool",     r"WhisperKool",         "whisperkool"),
    ("CellarPro",       r"CellarPro",           "cellarpro"),
    ("EuroCave",        r"EuroCave",            "eurocave"),
    ("KitchenAid",      r"KitchenAid",          "kitchenaid"),
    ("Thermador",  r"\bThermador\b",  "thermador"),
    ("Whirlpool",  r"\bWhirlpool\b",  "whirlpool"),
    ("Frigidaire", r"\bFrigidaire\b", "frigidaire"),
    ("Liebherr",   r"\bLiebherr\b",   "liebherr"),
    ("Hoshizaki",  r"\bHoshizaki\b",  "hoshizaki"),
    ("Manitowoc",  r"\bManitowoc\b",  "manitowoc"),
    ("Traulsen",   r"\bTraulsen\b",   "traulsen"),
    ("Vinotemp",   r"\bVinotemp\b",   "vinotemp"),
    ("Samsung",    r"\bSamsung\b",    "samsung"),
    ("Maytag",     r"\bMaytag\b",     "maytag"),
    ("Viking",     r"\bViking\b",     "viking"),
    ("Miele",      r"\bMiele\b",      "miele"),
    ("Bosch",      r"\bBosch\b",      "bosch"),
    ("Dacor",      r"\bDacor\b",      "dacor"),
    ("ILVE",       r"\bILVE\b",       "ilve"),
    ("Marvel",     r"\bMarvel\b",     "marvel"),
    ("Vulcan",     r"\bVulcan\b",     "vulcan"),
    ("Hestan",     r"\bHestan\b",     "hestan"),
    ("Alfresco",   r"\bAlfresco\b",   "alfresco"),
    ("Kalamazoo",  r"\bKalamazoo\b",  "kalamazoo"),
    ("Cove",       r"\bCove\b",       "cove"),
    ("GE",         r"\bGE\b(?!\s+(?:Caf(?:e|é)|Profile|Monogram))", "ge"),
    ("Wolf",       r"\bWolf\b",       "wolf"),
    ("Lynx",       r"\bLynx\b",       "lynx"),
    ("DCS",        r"\bDCS\b",        "dcs"),
    ("LG",         r"\bLG\b",         "lg"),
]

SLUG_BY_DISPLAY = {b[0]: b[2] for b in BRANDS}


def url_for(display, file_is_outdoor):
    slug = SLUG_BY_DISPLAY[display]
    if display in OUTDOOR_ONLY_BRANDS:
        return f"/outdoor/brands/{slug}/"
    if file_is_outdoor and display in ("Wolf", "Hestan"):
        return f"/outdoor/brands/{slug}/"
    return f"/brands/{slug}/"


def build_unsafe_mask(content):
    n = len(content)
    mask = bytearray(n)
    fm = re.match(r"^---\n.*?\n---\n", content, re.DOTALL)
    if fm:
        for i in range(fm.start(), fm.end()):
            mask[i] = 1
    patterns = [
        r"<a\b[^>]*>.*?</a>",
        r"<code\b[^>]*>.*?</code>",
        r"<pre\b[^>]*>.*?</pre>",
        r'<script\b[^>]*type\s*=\s*"application/ld\+json"[^>]*>.*?</script>',
    ]
    for pat in patterns:
        for m in re.finditer(pat, content, re.DOTALL | re.IGNORECASE):
            for i in range(m.start(), m.end()):
                mask[i] = 1
    return mask


def safe(match, mask):
    for i in range(match.start(), match.end()):
        if mask[i]:
            return False
    return True


def linkify_file(path):
    content = path.read_text(encoding="utf-8")
    mask = build_unsafe_mask(content)
    file_is_outdoor = path.name in OUTDOOR_FILES

    candidates = []
    for display, pat, _slug in BRANDS:
        for m in re.finditer(pat, content):
            if safe(m, mask):
                candidates.append((m.start(), m.end(), display, m.group(0)))
                break
    candidates.sort(key=lambda x: x[0])
    selected = candidates[:MAX_LINKS_PER_POST]
    if not selected:
        return 0, []

    selected_desc = sorted(selected, key=lambda x: x[0], reverse=True)
    new_content = content
    for start, end, display, text in selected_desc:
        url = url_for(display, file_is_outdoor)
        replacement = f'<a href="{url}" class="brand-inline-link">{text}</a>'
        new_content = new_content[:start] + replacement + new_content[end:]

    if new_content != content:
        path.write_text(new_content, encoding="utf-8")
    return len(selected), [d for _s, _e, d, _t in sorted(selected, key=lambda x: x[0])]


def main():
    files = sorted(p for p in BLOG_DIR.glob("*.astro") if p.name != "index.astro")
    total = 0
    rows = []
    for path in files:
        count, brands = linkify_file(path)
        total += count
        rows.append((path.name, count, brands))

    print(f"Files processed: {len(files)}")
    print(f"Total links added: {total}\n")
    print("Per-file breakdown:")
    for name, count, brands in rows:
        suffix = ", ".join(brands) if brands else "-"
        print(f"  [{count}] {name:<60} {suffix}")
    print(f"\nTOTAL: {total}")


if __name__ == "__main__":
    main()
