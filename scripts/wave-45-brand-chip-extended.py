"""
Wave 45: extend Wave 44 brand-chip resolver to cover 3 missed cases.

Additions vs Wave 44:
  1. Check /outdoor/brands/{slug}.astro as a pillar location (e.g. Lynx, Fire Magic,
     Twin Eagles, DCS, Hestan, Kalamazoo, Alfresco, Wolf — these live there, not
     in /brands/).
  2. Try category variants: e.g. for category="bbq-grill" also try "grill"
     (catches /brands/coyote-grill-repair, /brands/weber-grill-repair).
  3. Try slug-with-trailing-qualifier-dropped: "Wolf Outdoor" -> also try "wolf"
     (matches /outdoor/brands/wolf.astro).

Idempotent: chips already wrapped in <a> are untouched.
"""

from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
BRANDS_DIR = ROOT / "src" / "pages" / "brands"
OUTDOOR_BRANDS_DIR = ROOT / "src" / "pages" / "outdoor" / "brands"

# Build lookups for both brand-page locations
BRANDS_SLUGS = {p.stem for p in BRANDS_DIR.glob("*.astro")}
OUTDOOR_SLUGS = {p.stem for p in OUTDOOR_BRANDS_DIR.glob("*.astro")}

CHIP_RE = re.compile(
    r'<span(\s+class="brand-chip(?:\s+[^"]+)?")\s*>([^<]+)</span>'
)

# Trailing qualifiers to strip when generating slug variants.
# Only "outdoor" — dropping "commercial" or "residential" blurs product-line identity
# (e.g. Wolf Commercial range != Wolf Outdoor grill).
TRAILING_QUALIFIERS = {"outdoor"}

# Page filename hints that we're in outdoor/grill context (gates /outdoor/brands lookup).
OUTDOOR_CONTEXT_HINTS = {"grill", "bbq", "outdoor", "kitchen", "smoker", "patio", "fireplace"}


def html_decode(s: str) -> str:
    return s.replace("&amp;", "&").replace("&#39;", "'").replace("&quot;", '"')


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[&'`\".,/]", " ", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def slug_candidates(brand_text: str) -> list[str]:
    raw = html_decode(brand_text).strip()
    no_parens = re.sub(r"\s*\([^)]*\)", "", raw).strip()
    paren_inner = ""
    m = re.search(r"\(([^)]+)\)", raw)
    if m:
        paren_inner = m.group(1).strip()

    candidates: list[str] = []
    seen: set[str] = set()

    def add(c: str) -> None:
        if c and c not in seen:
            seen.add(c)
            candidates.append(c)

    primary = slugify(no_parens)
    add(primary)
    add(primary.replace("-", ""))

    # NEW (Wave 45): drop trailing qualifier (Outdoor/Commercial/Residential)
    parts = primary.split("-")
    if len(parts) > 1 and parts[-1] in TRAILING_QUALIFIERS:
        add("-".join(parts[:-1]))

    if paren_inner:
        add(slugify(paren_inner))

    if primary.startswith("ge-"):
        add(primary[3:])

    return candidates


def category_variants(category: str | None) -> list[str | None]:
    """Return ordered variants of category to try."""
    if not category:
        return [None]
    out = [category]
    # NEW (Wave 45): category prefix-stripping variants
    parts = category.split("-")
    # bbq-grill -> grill
    if len(parts) > 1 and parts[-1] in {"grill", "oven", "refrigerator", "freezer", "cooler", "cellar", "dryer", "washer"}:
        # drop everything before the head noun
        out.append(parts[-1])
    # outdoor-grill -> grill (already covered by above for 2-part)
    return out


def category_from_path(astro_path: Path) -> str | None:
    name = astro_path.stem
    if name.endswith("-repair"):
        return name[: -len("-repair")]
    if name == "index":
        parent = astro_path.parent.name
        if parent in {"commercial", "services", "outdoor"}:
            return None
        return parent
    return None


def resolve_url(
    brand_text: str,
    category: str | None,
    is_commercial: bool,
    is_outdoor_context: bool,
) -> tuple[str | None, str | None]:
    for slug in slug_candidates(brand_text):
        if not slug:
            continue
        # Try each category variant (e.g. bbq-grill, then grill)
        for cat in category_variants(category):
            if cat:
                combo = f"{slug}-{cat}-repair"
                if combo in BRANDS_SLUGS:
                    return f"/brands/{combo}/", f"brands/{combo}"
                if is_commercial:
                    cc = f"{slug}-commercial-{cat}-repair"
                    if cc in BRANDS_SLUGS:
                        return f"/brands/{cc}/", f"brands/{cc}"
        # NEW (Wave 45): outdoor pillar lookup — only on outdoor-context pages
        if is_outdoor_context and slug in OUTDOOR_SLUGS:
            return f"/outdoor/brands/{slug}/", f"outdoor/brands/{slug}"
        # /brands/ pillar fallback
        if slug in BRANDS_SLUGS:
            return f"/brands/{slug}/", f"brands/{slug}"
    return None, None


def process_file(path: Path, dry_run: bool) -> dict:
    rel = path.relative_to(ROOT)
    text = path.read_text(encoding="utf-8")
    category = category_from_path(path)
    rel_posix = rel.as_posix()
    is_commercial = "commercial" in rel_posix
    is_outdoor_context = (
        "/outdoor/" in rel_posix
        or any(h in (category or "") for h in OUTDOOR_CONTEXT_HINTS)
    )

    wrapped: list[tuple[str, str, str]] = []
    skipped: list[str] = []

    def repl(m: re.Match) -> str:
        class_attr = m.group(1)
        chip_text = m.group(2)
        # Per-chip override: if chip text mentions "outdoor", treat this chip as outdoor context.
        chip_outdoor = is_outdoor_context or "outdoor" in chip_text.lower()
        url, slug_used = resolve_url(chip_text, category, is_commercial, chip_outdoor)
        if url:
            wrapped.append((chip_text, url, slug_used))
            return f'<a href="{url}"{class_attr}>{chip_text}</a>'
        else:
            skipped.append(chip_text)
            return m.group(0)

    new_text = CHIP_RE.sub(repl, text)

    if not dry_run and new_text != text:
        path.write_text(new_text, encoding="utf-8")

    return {
        "path": rel.as_posix(),
        "category": category,
        "wrapped": wrapped,
        "skipped": skipped,
        "changed": new_text != text,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    targets = sorted(
        list((ROOT / "src" / "pages" / "services").rglob("*.astro"))
        + list((ROOT / "src" / "pages" / "commercial").rglob("*.astro"))
    )

    grand_wrapped = 0
    grand_skipped = 0
    file_count = 0
    gap_brands: dict[str, int] = {}

    for path in targets:
        text = path.read_text(encoding="utf-8")
        if "<span class=\"brand-chip" not in text:
            continue
        result = process_file(path, args.dry_run)
        if result["wrapped"]:
            file_count += 1
            print(f"\n{result['path']}  (category={result['category']})")
            for chip_text, url, slug in result["wrapped"]:
                print(f"  WRAP  {chip_text!r:<30} -> {url}")
        for chip_text in result["skipped"]:
            gap_brands[chip_text] = gap_brands.get(chip_text, 0) + 1
        grand_wrapped += len(result["wrapped"])
        grand_skipped += len(result["skipped"])

    print("\n" + "=" * 70)
    print(f"Files newly touched (Wave 45 wrapped >=1): {file_count}")
    print(f"New chips wrapped this run: {grand_wrapped}")
    print(f"Chips remaining as content gaps: {grand_skipped}")
    print(f"Mode: {'DRY-RUN' if args.dry_run else 'APPLIED'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
