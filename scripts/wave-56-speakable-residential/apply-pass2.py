"""Wave 56 pass 2 — handle alternative schema patterns:

Pattern A (7 files): inline `const schemaJsons = [name1, name2, ...];`
  - Insert new `const speakableSchema = {...};` line BEFORE this array
  - Append `, speakableSchema` to the array

Pattern B (3 files): single `const schema = {...}` with JSON.stringify(schema)
  - Insert a second const `const speakableSchema = {...};`
  - Insert a second <script type="application/ld+json"> tag for it
"""
import re
import os
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
BRANDS_DIR = ROOT / "src" / "pages" / "brands"

SPEAKABLE_CONST = '''const speakableSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "url": canonical,
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".intro-speakable", ".faq-item:first-of-type"]
  }
};
'''

PLAIN_P_AFTER_H2_RE = re.compile(r'(</h2>\s*\n\s*)<p>')

PATTERN_A_FILES = [
    "danby-wine-cooler", "delfield", "perlick-commercial",
    "summit-wine-cooler", "traulsen", "vinotemp", "wine-enthusiast-wine-cooler"
]
PATTERN_B_FILES = ["hoshizaki", "manitowoc", "vulcan"]

stats = {"pass2_added": [], "pass2_class_added": [], "errors": []}

# ----- Pattern A: inline schemaJsons array -----
for slug in PATTERN_A_FILES:
    f = BRANDS_DIR / f"{slug}.astro"
    if not f.exists():
        stats["errors"].append(f"{slug}: file missing")
        continue
    content = f.read_text(encoding="utf-8")
    if "SpeakableSpecification" in content:
        continue  # already done somehow

    # Find: const schemaJsons = [localBusinessSchema, serviceSchema, faqSchema, breadcrumbSchema];
    arr_match = re.search(r'(const schemaJsons = \[)([^\]]+)(\];)', content)
    if not arr_match:
        stats["errors"].append(f"{slug}: pattern A schemaJsons line not found")
        continue

    prefix = arr_match.group(1)
    inner = arr_match.group(2)
    suffix = arr_match.group(3)
    new_inner = inner.rstrip() + ", speakableSchema"
    new_arr_line = prefix + new_inner + suffix

    # Insert speakableSchema const BEFORE the array line
    insertion_point = arr_match.start()
    new_content = content[:insertion_point] + SPEAKABLE_CONST + content[insertion_point:]
    # Now find the new array line position (shifted by SPEAKABLE_CONST length) and replace
    shifted_arr_start = insertion_point + len(SPEAKABLE_CONST)
    shifted_arr_end = shifted_arr_start + (arr_match.end() - arr_match.start())
    new_content = new_content[:shifted_arr_start] + new_arr_line + new_content[shifted_arr_end:]

    # Intro class
    p_match = PLAIN_P_AFTER_H2_RE.search(new_content)
    if p_match:
        new_content = new_content[:p_match.start()] + p_match.group(1) + '<p class="intro-speakable">' + new_content[p_match.end():]
        stats["pass2_class_added"].append(slug)

    tmp = f.with_suffix(".astro.tmp")
    tmp.write_text(new_content, encoding="utf-8")
    os.replace(tmp, f)
    stats["pass2_added"].append(f"{slug} (A)")

# ----- Pattern B: single `const schema = {...}` -----
for slug in PATTERN_B_FILES:
    f = BRANDS_DIR / f"{slug}.astro"
    if not f.exists():
        stats["errors"].append(f"{slug}: file missing")
        continue
    content = f.read_text(encoding="utf-8")
    if "SpeakableSpecification" in content:
        continue

    # Find end of frontmatter (the line `---` after the consts)
    # Insert speakableSchema const right before the closing frontmatter
    fm_end = re.search(r'\n---\n', content)
    if not fm_end:
        stats["errors"].append(f"{slug}: pattern B frontmatter close not found")
        continue

    new_content = content[:fm_end.start()] + "\n\n" + SPEAKABLE_CONST + content[fm_end.start():]

    # Now find the existing JSON.stringify(schema) script and add a second after it
    script_match = re.search(
        r'(<script type="application/ld\+json" set:html=\{JSON\.stringify\(schema\)\} />)',
        new_content
    )
    if not script_match:
        stats["errors"].append(f"{slug}: pattern B existing script tag not found")
        continue
    new_script = script_match.group(1) + '\n  <script type="application/ld+json" set:html={JSON.stringify(speakableSchema)} />'
    new_content = new_content[:script_match.start()] + new_script + new_content[script_match.end():]

    # Intro class
    p_match = PLAIN_P_AFTER_H2_RE.search(new_content)
    if p_match:
        new_content = new_content[:p_match.start()] + p_match.group(1) + '<p class="intro-speakable">' + new_content[p_match.end():]
        stats["pass2_class_added"].append(slug)

    tmp = f.with_suffix(".astro.tmp")
    tmp.write_text(new_content, encoding="utf-8")
    os.replace(tmp, f)
    stats["pass2_added"].append(f"{slug} (B)")

print(f"Pass 2 added: {len(stats['pass2_added'])}")
for s in stats["pass2_added"]:
    print(f"  {s}")
print(f"\nIntro class added: {len(stats['pass2_class_added'])}")
print(f"\nErrors: {len(stats['errors'])}")
for e in stats["errors"]:
    print(f"  {e}")
