"""Fix 3 files where Wave 56 sweep mis-inserted Speakable into faqs array
instead of schemaJsons array. Files: fisher-paykel, ilve, signature-kitchen-suite.

For each:
1. Remove the wrong-position Speakable block (sandwiched between faqs close and schemaJsons open)
2. Insert it correctly before the schemaJsons array's `];` close
"""
import re
import os
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
BRANDS_DIR = ROOT / "src" / "pages" / "brands"

FILES = [
    "asko", "bertazzoni", "bluestar", "captiveaire", "electrolux", "eurocave",
    "gaggenau", "ge-cafe", "ge-monogram", "ge-profile", "hestan", "le-cache",
    "liebherr", "magic-chef", "marvel", "smeg", "speed-queen", "u-line"
]

# Pattern of WRONG insertion: after `};\n` (FAQ array close), before `\nconst schemaJsons = [`
# Captured groups: leading FAQ close, the wrong WebPage block + ];, the schemaJsons const start
WRONG_PATTERN = re.compile(
    r'(  }\n)'
    r',\n  \{\n'
    r'    "@context": "https://schema\.org",\n'
    r'    "@type": "WebPage",\n'
    r'    "url": canonical,\n'
    r'    "speakable": \{\n'
    r'      "@type": "SpeakableSpecification",\n'
    r'      "cssSelector": \[".intro-speakable", "\.faq-item:first-of-type"\]\n'
    r'    \}\n'
    r'  \}\n'
    r'(\];\n\n'
    r'const schemaJsons = \[)',
    re.MULTILINE
)

# Pattern of CORRECT insertion target: the schemaJsons array's closing
SCHEMA_CLOSE_RE = re.compile(r'(\n\s*})(\s*\n)(\];)', re.MULTILINE)

SPEAKABLE_OBJ = '''  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": canonical,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".intro-speakable", ".faq-item:first-of-type"]
    }
  }'''

for slug in FILES:
    f = BRANDS_DIR / f"{slug}.astro"
    content = f.read_text(encoding="utf-8")

    # Step 1: remove wrong insertion
    m = WRONG_PATTERN.search(content)
    if not m:
        print(f"  {slug}: WRONG pattern NOT FOUND — file may have different state")
        continue
    new_content = content[:m.start()] + m.group(1) + m.group(2) + content[m.end():]

    # Step 2: insert into schemaJsons array (last occurrence of `};\n];` after removing wrong)
    # Find the LAST closing `}\n];` in the file (this is the schemaJsons array close)
    # Iterate matches to find the rightmost one
    last_match = None
    for sm in SCHEMA_CLOSE_RE.finditer(new_content):
        last_match = sm
    if not last_match:
        print(f"  {slug}: schemaJsons closer NOT FOUND")
        continue

    insert_text = last_match.group(1) + last_match.group(2) + ",\n" + SPEAKABLE_OBJ + last_match.group(2) + last_match.group(3)
    final_content = new_content[:last_match.start()] + insert_text + new_content[last_match.end():]

    tmp = f.with_suffix(".astro.tmp")
    tmp.write_text(final_content, encoding="utf-8")
    os.replace(tmp, f)
    print(f"  {slug}: FIXED")

print("\nVerification:")
for slug in FILES:
    f = BRANDS_DIR / f"{slug}.astro"
    content = f.read_text(encoding="utf-8")
    count = content.count("SpeakableSpecification")
    print(f"  {slug}: SpeakableSpecification count = {count}")
