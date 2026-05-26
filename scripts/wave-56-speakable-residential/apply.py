"""Wave 56 — add SpeakableSpecification schema to residential brand pillars.

For each pillar file in src/pages/brands/{slug}.astro (not ending in -repair):
1. Insert WebPage schema with Speakable cssSelector as last entry in schemaJsons array
2. Add class="intro-speakable" to first <p> immediately after first </h2> if plain <p>
3. Skip if Speakable already present
4. Report per-file outcome
"""
import re
import os
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
BRANDS_DIR = ROOT / "src" / "pages" / "brands"

SPEAKABLE_OBJ = '''  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": canonical,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".intro-speakable", ".faq-item:first-of-type"]
    }
  }'''

SCHEMA_CLOSE_RE = re.compile(r'(\n\s*})(\s*\n)(\];)', re.MULTILINE)
PLAIN_P_AFTER_H2_RE = re.compile(r'(</h2>\s*\n\s*)<p>')

stats = {
    "schema_added": [],
    "schema_skipped_no_array": [],
    "schema_skipped_no_canonical": [],
    "schema_already_present": [],
    "class_added": [],
    "class_skipped_no_h2_p_pattern": [],
    "class_already_present": [],
    "errors": []
}

files = sorted(BRANDS_DIR.glob("*.astro"))
files = [f for f in files if f.stem != "index" and not f.stem.endswith("-repair")]

print(f"Processing {len(files)} pillar files...")

for f in files:
    slug = f.stem
    try:
        content = f.read_text(encoding="utf-8")
    except Exception as e:
        stats["errors"].append({"file": f.name, "error": str(e)})
        continue

    if "SpeakableSpecification" in content:
        stats["schema_already_present"].append(slug)
        continue

    # Find canonical const — required since WebPage schema uses it
    canonical_match = re.search(r'const\s+canonical\s*=', content)
    canonical_inferred = canonical_match is not None

    if not canonical_inferred:
        # Try fallback: use literal URL string
        url_value = f'"https://samedayappliance.repair/brands/{slug}/"'
    else:
        url_value = "canonical"

    speakable_block = SPEAKABLE_OBJ.replace("canonical", url_value, 1) if not canonical_inferred else SPEAKABLE_OBJ

    # Inject into schemaJsons array: find the last `}` before `];`
    match = SCHEMA_CLOSE_RE.search(content)
    if not match:
        stats["schema_skipped_no_array"].append(slug)
        continue

    insert_text = match.group(1) + match.group(2) + ",\n" + speakable_block + match.group(2) + match.group(3)
    new_content = content[:match.start()] + insert_text + content[match.end():]
    stats["schema_added"].append(slug)

    # Add intro-speakable class to first <p> after first </h2>
    p_match = PLAIN_P_AFTER_H2_RE.search(new_content)
    if p_match:
        new_content = new_content[:p_match.start()] + p_match.group(1) + '<p class="intro-speakable">' + new_content[p_match.end():]
        stats["class_added"].append(slug)
    else:
        stats["class_skipped_no_h2_p_pattern"].append(slug)

    # Atomic write
    tmp = f.with_suffix(".astro.tmp")
    tmp.write_text(new_content, encoding="utf-8")
    os.replace(tmp, f)

print(f"\n=== Schema injection ===")
print(f"  Added: {len(stats['schema_added'])}")
print(f"  Already present: {len(stats['schema_already_present'])}")
print(f"  Skipped (no schemaJsons array close pattern): {len(stats['schema_skipped_no_array'])}")
print(f"\n=== Intro class injection ===")
print(f"  Added: {len(stats['class_added'])}")
print(f"  Skipped (no </h2>+<p> plain pattern): {len(stats['class_skipped_no_h2_p_pattern'])}")
print(f"\nErrors: {len(stats['errors'])}")

if stats["schema_skipped_no_array"]:
    print(f"\nFiles where schema NOT added (no array closer found):")
    for s in stats["schema_skipped_no_array"]:
        print(f"  {s}")

if stats["class_skipped_no_h2_p_pattern"]:
    print(f"\nFiles where intro-speakable class NOT added (no plain `</h2>\\n<p>` match — may have attributed <p> instead):")
    for s in stats["class_skipped_no_h2_p_pattern"]:
        print(f"  {s}")

if stats["errors"]:
    print(f"\nERRORS:")
    for e in stats["errors"]:
        print(f"  {e}")
