"""Wave 47 — apply breadcrumb injection to brand combo pages.

For each candidate from wave-47-candidates.json:
1. Read file
2. Find first occurrence of </section> after <Layout opening
   (this closes the Hero block — confirmed structure from recon)
3. Inject visible HTML breadcrumb block immediately after this </section>
4. Also inject BreadcrumbList JSON-LD into schemaJsons array if not already present
5. Write file back

Safety:
- Read file content fresh per file (no shared state)
- Skip if injection markers already present
- Verify Hero anchor exists before injecting
- Atomic write (write to tmp, rename)
"""
import json
import re
import os
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
CANDIDATES = ROOT / "audit-output" / "wave-47-candidates.json"

with open(CANDIDATES, encoding="utf-8") as f:
    candidates = json.load(f)

BREADCRUMB_HTML = '''
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/">Home</a> <span class="crumbs-sep">›</span>
  <a href="/brands/">Brands</a> <span class="crumbs-sep">›</span>
  <a href="/brands/{brand_slug}/">{brand_display}</a> <span class="crumbs-sep">›</span>
  <span aria-current="page">{category_display} Repair</span>
</nav>
'''

BREADCRUMB_JSONLD_TEMPLATE = '''{{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://samedayappliance.repair/" }},
      {{ "@type": "ListItem", "position": 2, "name": "Brands", "item": "https://samedayappliance.repair/brands/" }},
      {{ "@type": "ListItem", "position": 3, "name": "{brand_display}", "item": "https://samedayappliance.repair/brands/{brand_slug}/" }},
      {{ "@type": "ListItem", "position": 4, "name": "{category_display} Repair" }}
    ]
  }}'''

MARKER = '<nav class="crumbs"'

stats = {
    "processed": 0,
    "skipped_already_has_breadcrumb": 0,
    "skipped_no_hero_anchor": 0,
    "skipped_no_layout_open": 0,
    "errors": [],
    "modified_files": [],
}

for cand in candidates:
    file_path = ROOT / "src" / "pages" / "brands" / cand["file"]

    if not file_path.exists():
        stats["errors"].append({"file": cand["file"], "error": "file not found"})
        continue

    content = file_path.read_text(encoding="utf-8")

    if MARKER in content:
        stats["skipped_already_has_breadcrumb"] += 1
        continue

    layout_match = re.search(r'<Layout\s', content)
    if not layout_match:
        stats["skipped_no_layout_open"] += 1
        stats["errors"].append({"file": cand["file"], "error": "no <Layout open found"})
        continue

    layout_pos = layout_match.start()

    section_close_pattern = re.compile(r'</section>\s*\n', re.MULTILINE)
    section_match = section_close_pattern.search(content, layout_pos)

    if not section_match:
        stats["skipped_no_hero_anchor"] += 1
        stats["errors"].append({"file": cand["file"], "error": "no </section> after <Layout"})
        continue

    insert_pos = section_match.end()

    crumb_html = BREADCRUMB_HTML.format(
        brand_slug=cand["brand_slug"],
        brand_display=cand["brand_display"],
        category_display=cand["category_display"],
    )

    new_content = content[:insert_pos] + crumb_html + content[insert_pos:]

    if '"@type": "BreadcrumbList"' not in new_content:
        sj_match = re.search(r'(const\s+schemaJsons\s*=\s*\[)', new_content)
        if sj_match:
            arr_start = sj_match.end()
            depth = 1
            i = arr_start
            while i < len(new_content) and depth > 0:
                c = new_content[i]
                if c == '[':
                    depth += 1
                elif c == ']':
                    depth -= 1
                    if depth == 0:
                        break
                i += 1

            if depth == 0:
                jsonld = BREADCRUMB_JSONLD_TEMPLATE.format(
                    brand_slug=cand["brand_slug"],
                    brand_display=cand["brand_display"],
                    category_display=cand["category_display"],
                )
                injection = ",\n  " + jsonld + "\n"
                new_content = new_content[:i] + injection + new_content[i:]

    tmp_path = file_path.with_suffix(file_path.suffix + ".tmp")
    tmp_path.write_text(new_content, encoding="utf-8")
    os.replace(tmp_path, file_path)

    stats["processed"] += 1
    stats["modified_files"].append(cand["file"])

print("=" * 60)
print("WAVE 47 APPLY — Results")
print("=" * 60)
print(f"Candidates loaded:                    {len(candidates)}")
print(f"Processed (modified):                 {stats['processed']}")
print(f"Skipped - already has breadcrumb:     {stats['skipped_already_has_breadcrumb']}")
print(f"Skipped - no Hero </section>:         {stats['skipped_no_hero_anchor']}")
print(f"Skipped - no <Layout open:            {stats['skipped_no_layout_open']}")
print(f"Errors:                               {len(stats['errors'])}")

if stats["errors"]:
    print("\n!!! ERRORS !!!")
    for e in stats["errors"][:20]:
        print(f"  {e['file']}: {e['error']}")

stats_path = ROOT / "audit-output" / "wave-47-apply-stats.json"
with open(stats_path, "w", encoding="utf-8") as f:
    json.dump(stats, f, indent=2, ensure_ascii=False)
print(f"\nFull stats saved to: {stats_path}")
