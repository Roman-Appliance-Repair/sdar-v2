"""Wave 32 — build deduplicated, target-substituted redirect blocks.

Outputs:
  /tmp/wave32-astro-append.txt  — block to append into astro.config.mjs `redirects: { ... }`
  /tmp/wave32-cf-append.txt     — block to append to public/_redirects

Rules applied:
1. For unique targets that don't exist in src/pages/, substitute to nearest
   real fallback (brand canonical sibling or service hub).
2. For sources that already appear in the pre-existing config block,
   keep the pre-existing entry (brand-specific is better than pillar fallback)
   and DROP the Wave 32 duplicate.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).parent.parent
WAVE32_FINAL = Path(r"C:\Users\Roman\Downloads\wave-32-redirects-FINAL.txt")
ASTRO_CONFIG = ROOT / "astro.config.mjs"

# Target substitutions for missing destinations.
TARGET_SUBSTITUTIONS = {
    # Brand-page fallbacks — sibling brand category or services hub
    "/brands/amana-freezer-repair/": "/brands/amana-refrigerator-repair/",
    "/brands/amana-stove-repair/": "/brands/amana-range-repair/",
    "/brands/amana-washer-repair/": "/brands/amana-laundry-repair/",
    "/brands/balancing-freezer-repair/": "/services/freezer-repair/",
    "/brands/blomberg-refrigerator-repair/": "/services/refrigerator-repair/",
    "/brands/blomberg-washer-repair/": "/services/washer-repair/",
    "/brands/bosch-stove-repair/": "/brands/bosch-range-repair/",
    "/brands/dacor-freezer-repair/": "/brands/dacor-refrigerator-repair/",
    "/brands/dacor-range-repair/": "/brands/dacor-oven-repair/",
    "/brands/danby-freezer-repair/": "/services/freezer-repair/",
    "/brands/electrolux-freezer-repair/": "/brands/electrolux-refrigerator-repair/",
    "/brands/electrolux-stove-repair/": "/brands/electrolux-oven-repair/",
    "/brands/fisher-paykel-dryer-repair/": "/brands/fisher-paykel-washer-repair/",
    "/brands/fisher-paykel-freezer-repair/": "/brands/fisher-paykel-refrigerator-repair/",
    "/brands/frigidaire-stove-repair/": "/brands/frigidaire-range-repair/",
    "/brands/galanz-freezer-repair/": "/services/freezer-repair/",
    "/brands/ge-freezer-repair/": "/brands/ge-refrigerator-repair/",
    "/brands/ge-monogram-freezer-repair/": "/brands/ge-monogram-refrigerator-repair/",
    "/brands/haier-stove-repair/": "/brands/haier-oven-repair/",
    "/brands/hotpoint-refrigerator-repair/": "/services/refrigerator-repair/",
    "/brands/kenmore-freezer-repair/": "/brands/kenmore/",
    "/brands/kenmore-refrigerator-repair/": "/brands/kenmore/",
    "/brands/kenmore-stove-repair/": "/brands/kenmore-oven-repair/",
    "/brands/kenmore-washer-repair/": "/brands/kenmore/",
    "/brands/kitchenaid-stove-repair/": "/brands/kitchenaid-oven-repair/",
    "/brands/magic-chef-freezer-repair/": "/services/freezer-repair/",
    "/brands/magic-chef-refrigerator-repair/": "/services/refrigerator-repair/",
    "/brands/maytag-freezer-repair/": "/brands/maytag-refrigerator-repair/",
    "/brands/miele-stove-repair/": "/brands/miele-oven-repair/",
    "/brands/roper-washer-repair/": "/services/washer-repair/",
    "/brands/speed-queen-dryer-repair/": "/brands/speed-queen-washer-dryer-repair/",
    "/brands/speed-queen-washer-repair/": "/brands/speed-queen-washer-dryer-repair/",
    # Commercial dishwasher brand pages live at /brands/X/, not /commercial/dishwasher-repair/brands/X/
    "/commercial/dishwasher-repair/brands/champion-dishwasher-repair/": "/brands/champion-dishwasher-repair/",
    "/commercial/dishwasher-repair/brands/cma-dishwasher-repair/": "/brands/cma-dishmachines-repair/",
    "/commercial/dishwasher-repair/brands/hobart-dishwasher-repair/": "/brands/hobart-dishwasher-repair/",
    "/commercial/dishwasher-repair/brands/jackson-dishwasher-repair/": "/brands/jackson-dishwasher-repair/",
    "/commercial/dishwasher-repair/brands/meiko-dishwasher-repair/": "/brands/meiko-dishwasher-repair/",
    "/commercial/dishwasher-repair/brands/winterhalter-dishwasher-repair/": "/brands/winterhalter-dishwasher-repair/",
    # City fallbacks — neighborhoods/districts not in cities.ts
    "/downtown-los-angeles/": "/los-angeles/",
    "/east-hollywood/": "/hollywood/",
    "/hollywood-hills/": "/hollywood/",
    "/ladera-heights/": "/culver-city/",
    "/playa-del-rey/": "/marina-del-rey/",
}


def parse_existing_sources():
    text = ASTRO_CONFIG.read_text(encoding="utf-8")
    return {s for s, _ in re.findall(r"'(/[^']+)':\s*'(/[^']*)'", text)}


def main():
    existing_sources = parse_existing_sources()
    print(f"Pre-existing redirect sources: {len(existing_sources)}")

    raw = WAVE32_FINAL.read_text(encoding="utf-8")
    lines = raw.split("\n")

    out_astro = []
    out_cf = []
    section_header = None
    sources_seen = set()
    skipped_duplicate = 0
    substituted = 0
    added = 0

    for line in lines:
        # Section header like "// === A_brand_prefix... ==="
        m_section = re.match(r"//\s*===\s*(.+?)\s*===\s*$", line.strip())
        if m_section:
            section_header = m_section.group(1)
            out_astro.append(f"\n    // === Wave 32 :: {section_header} ===")
            out_cf.append(f"\n# === Wave 32 :: {section_header} ===")
            continue
        # Top-of-file header lines / blank
        if line.strip().startswith("// Wave 32 ") or line.strip().startswith("// Total:") or line.strip().startswith("// Generated:"):
            continue
        # Entry line: '/source/': '/target/',
        m_entry = re.match(r"\s*'(/[^']+)':\s*'(/[^']*)',?\s*$", line)
        if not m_entry:
            continue
        source, target = m_entry.group(1), m_entry.group(2)

        # Skip if already in pre-existing config
        if source in existing_sources:
            skipped_duplicate += 1
            continue
        # Skip wave-32 internal duplicates
        if source in sources_seen:
            skipped_duplicate += 1
            continue
        sources_seen.add(source)

        # Apply target substitution
        if target in TARGET_SUBSTITUTIONS:
            target = TARGET_SUBSTITUTIONS[target]
            substituted += 1

        out_astro.append(f"    '{source}': '{target}',")
        # Cloudflare format: source target 301 (no trailing slash on source side; preserve the trailing on path)
        cf_source = source.rstrip("/")
        if not cf_source:
            cf_source = "/"
        out_cf.append(f"{cf_source}  {target}  301")
        added += 1

    print(f"Added: {added}")
    print(f"Skipped (duplicate of existing or wave32-internal): {skipped_duplicate}")
    print(f"Targets substituted: {substituted}")

    Path("/tmp").mkdir(exist_ok=True)
    Path(r"C:\Users\Roman\WebstormProjects\sdar-v2\scripts\wave32-astro-append.txt").write_text("\n".join(out_astro) + "\n", encoding="utf-8")
    Path(r"C:\Users\Roman\WebstormProjects\sdar-v2\scripts\wave32-cf-append.txt").write_text("\n".join(out_cf) + "\n", encoding="utf-8")
    print(f"\nWrote scripts/wave32-astro-append.txt and scripts/wave32-cf-append.txt")


if __name__ == "__main__":
    main()
