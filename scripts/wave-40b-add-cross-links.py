"""Wave 40b — insert 'All <Brand> services we repair' block into pillar pages.

Inserts a deterministic links-only section just before the final CTA section
on sub-zero / thermador / miele / viking pillars. Lists every brands/<slug>-X-repair.astro
that exists, even if some are already linked elsewhere on the page.

Filters out URLs still in the redirect map so the new block can never introduce
new stale links.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Skip URLs that still 301-redirect (we don't want to re-introduce stale links).
redirect_map = json.loads(
    (ROOT / "audit-output" / "redirect-map.json").read_text(encoding="utf-8")
)
REDIRECTED = {k for k, v in redirect_map.items() if k.rstrip("/") != v.rstrip("/")}

BRANDS = {
    # Wave 40b
    "sub-zero": "Sub-Zero",
    "thermador": "Thermador",
    "miele": "Miele",
    "viking": "Viking",
    # Wave 40c
    "amana": "Amana",
    "bosch": "Bosch",
    "dacor": "Dacor",
    "frigidaire": "Frigidaire",
    "ge": "GE",
    "haier": "Haier",
    "jennair": "JennAir",
    "kitchenaid": "KitchenAid",
    "lg": "LG",
    "maytag": "Maytag",
    "samsung": "Samsung",
    "whirlpool": "Whirlpool",
}

ACRONYM = {"bbq", "ge", "lg"}


def slug_to_label(slug: str, brand_slug: str) -> str:
    # Strip leading "<brand-slug>-" and trailing "-repair"
    s = slug
    if s.startswith(brand_slug + "-"):
        s = s[len(brand_slug) + 1 :]
    if s.endswith("-repair"):
        s = s[: -len("-repair")]
    parts = []
    for w in s.split("-"):
        if w.lower() in ACRONYM:
            parts.append(w.upper())
        else:
            parts.append(w[:1].upper() + w[1:])
    return " ".join(parts)


BLOCK_MARKER = "ALL CATEGORY LINKS (Wave 40"

for brand_slug, brand_name in BRANDS.items():
    pillar = ROOT / "src" / "pages" / "brands" / f"{brand_slug}.astro"
    if not pillar.exists():
        print(f"  SKIP {brand_slug}: pillar file missing")
        continue
    text = pillar.read_text(encoding="utf-8")
    if BLOCK_MARKER in text:
        print(f"  SKIP {brand_slug}: cross-link block already present (idempotent)")
        continue

    # Find all category .astro files for this brand
    pattern = f"{brand_slug}-*.astro"
    cat_files = sorted(
        (ROOT / "src" / "pages" / "brands").glob(pattern)
    )
    cat_slugs = [p.stem for p in cat_files]

    # Build the link list, skipping any URL that itself 301-redirects.
    items = []
    skipped = []
    for cat_slug in cat_slugs:
        href = f"/brands/{cat_slug}/"
        if href in REDIRECTED or href.rstrip("/") in REDIRECTED:
            skipped.append(cat_slug)
            continue
        label = slug_to_label(cat_slug, brand_slug)
        items.append(
            f'        <li><a href="{href}">{brand_name} {label} Repair</a></li>'
        )

    # Build the new section
    new_section = f"""
  <!-- ── ALL CATEGORY LINKS (Wave 40b — pillar-to-category cross-links) ── -->
  <section class="section section-light">
    <div class="container narrow">
      <p class="eyebrow-sub">Every {brand_name} category we cover</p>
      <h2>All {brand_name} repair services in one place</h2>
      <ul class="cat-list">
{chr(10).join(items)}
      </ul>
    </div>
  </section>
"""

    # Find insertion point — try several patterns in order of specificity.
    # 1. <section> containing "Ready to schedule" h2 (Wave 40b pillars)
    # 2. <section class="bottom-cta"> or <section ... class="cta-bottom">
    #    or <section id="book"> (Wave 40c pillar variants)
    # 3. Last <section> in file (final fallback)
    insert_pos = None
    cta_match = re.search(
        r"(\s*<!-- [^>]*?-->\s*)?<section[^>]*>\s*<div[^>]*>\s*<h2>Ready to schedule",
        text,
    )
    if cta_match:
        insert_pos = cta_match.start()
    else:
        m = re.search(
            r'<section[^>]*class="[^"]*\b(bottom-cta|cta-bottom)\b[^"]*"',
            text,
        )
        if m:
            insert_pos = m.start()
        else:
            m = re.search(r'<section[^>]*id="book"', text)
            if m:
                insert_pos = m.start()
            else:
                # Last resort: last <section in file
                last = text.rfind("<section")
                if last > 0:
                    insert_pos = last

    if insert_pos is None:
        print(f"  SKIP {brand_slug}: no insertion point found")
        continue

    new_text = text[:insert_pos] + new_section + "\n" + text[insert_pos:]
    pillar.write_text(new_text, encoding="utf-8")
    print(f"  OK {brand_slug}: inserted block with {len(items)} category links")
