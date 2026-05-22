"""
Wave 44: wrap unwrapped brand chips on service/commercial hub pages.

Pattern: <span class="brand-chip[ X]">Brand Name</span>
   →    <a href="/brands/{slug}/" class="brand-chip[ X]">Brand Name</a>

Resolution order per chip:
  1. /brands/{slug}-{category}-repair/  (e.g. eurocave-wine-cooler-repair)
  2. /brands/{slug}-commercial-{category}-repair/  (e.g. adc-commercial-dryer-repair)
  3. /brands/{slug}/  (pillar fallback)
  4. Leave unwrapped (content gap, logged)

Slug normalization tries multiple variants per brand text.
"""

from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path

# Windows console default cp1252 chokes on unicode in chip text — force utf-8.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
BRANDS_DIR = ROOT / "src" / "pages" / "brands"

# Build set of all known brand-page slugs (filename minus .astro).
KNOWN_SLUGS = {p.stem for p in BRANDS_DIR.glob("*.astro")}

CHIP_RE = re.compile(
    r'<span(\s+class="brand-chip(?:\s+[^"]+)?")\s*>([^<]+)</span>'
)


def html_decode(s: str) -> str:
    return s.replace("&amp;", "&").replace("&#39;", "'").replace("&quot;", '"')


def slug_candidates(brand_text: str) -> list[str]:
    """Return ordered list of slug candidates to try."""
    raw = html_decode(brand_text).strip()
    # strip parens content: "SKS (Signature Kitchen Suite)" -> "SKS"
    no_parens = re.sub(r"\s*\([^)]*\)", "", raw).strip()
    paren_inner = ""
    m = re.search(r"\(([^)]+)\)", raw)
    if m:
        paren_inner = m.group(1).strip()

    def slugify(s: str) -> str:
        s = s.lower()
        # drop ampersands and other punctuation
        s = re.sub(r"[&'`\".,/]", " ", s)
        # collapse whitespace and convert to hyphens
        s = re.sub(r"\s+", "-", s)
        # collapse multiple hyphens
        s = re.sub(r"-+", "-", s).strip("-")
        return s

    candidates: list[str] = []
    seen: set[str] = set()

    def add(c: str) -> None:
        if c and c not in seen:
            seen.add(c)
            candidates.append(c)

    primary = slugify(no_parens)
    add(primary)
    # Variant: collapse hyphen (jenn-air -> jennair)
    add(primary.replace("-", ""))
    # Variant: split-back (jennair -> jenn-air) — only if no internal hyphen yet
    # (skip auto-split, would over-match)

    if paren_inner:
        add(slugify(paren_inner))

    # Strip leading "ge-" prefix (GE Cafe -> cafe, GE Profile -> profile)
    if primary.startswith("ge-"):
        add(primary[3:])

    return candidates


def category_from_path(astro_path: Path) -> str | None:
    """Derive category slug from page filename. Return None if no specific category."""
    rel = astro_path.relative_to(ROOT / "src" / "pages")
    name = astro_path.stem
    # services/wine-cooler-repair.astro -> wine-cooler
    # commercial/dryer-repair.astro -> dryer
    # commercial/refrigeration/walk-in-cooler-repair.astro -> walk-in-cooler
    if name.endswith("-repair"):
        return name[: -len("-repair")]
    # commercial/ice-machines/soft-serve/index.astro -> soft-serve
    if name == "index":
        # parent dir name
        parent = astro_path.parent.name
        if parent in {"commercial", "services", "outdoor"}:
            return None  # no specific category
        return parent
    return None


def resolve_url(brand_text: str, category: str | None, is_commercial: bool) -> tuple[str | None, str | None]:
    """
    Returns (url, slug-used) or (None, None) if no resolution.
    """
    for slug in slug_candidates(brand_text):
        if not slug:
            continue
        if category:
            combo = f"{slug}-{category}-repair"
            if combo in KNOWN_SLUGS:
                return f"/brands/{combo}/", combo
            if is_commercial:
                cc = f"{slug}-commercial-{category}-repair"
                if cc in KNOWN_SLUGS:
                    return f"/brands/{cc}/", cc
        # pillar fallback
        if slug in KNOWN_SLUGS:
            return f"/brands/{slug}/", slug
    return None, None


def process_file(path: Path, dry_run: bool) -> dict:
    """Walk one file, return stats dict."""
    rel = path.relative_to(ROOT)
    text = path.read_text(encoding="utf-8")
    category = category_from_path(path)
    is_commercial = "commercial" in str(rel).split(Path("/").drive or "/")[-1].split("\\") or "commercial" in rel.as_posix()

    wrapped = []
    skipped = []

    def repl(m: re.Match) -> str:
        class_attr = m.group(1)  # e.g. ' class="brand-chip dark"'
        chip_text = m.group(2)
        url, slug_used = resolve_url(chip_text, category, is_commercial)
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
        # cheap skip if no chip pattern
        text = path.read_text(encoding="utf-8")
        if "brand-chip" not in text:
            continue
        result = process_file(path, args.dry_run)
        if result["wrapped"] or result["skipped"]:
            file_count += 1
            print(f"\n{result['path']}  (category={result['category']})")
            for chip_text, url, slug in result["wrapped"]:
                print(f"  WRAP  {chip_text!r:<35} -> {url}")
            for chip_text in result["skipped"]:
                print(f"  GAP   {chip_text!r}")
                gap_brands[chip_text] = gap_brands.get(chip_text, 0) + 1
            grand_wrapped += len(result["wrapped"])
            grand_skipped += len(result["skipped"])

    print("\n" + "=" * 70)
    print(f"Files touched: {file_count}")
    print(f"Chips wrapped: {grand_wrapped}")
    print(f"Chips left as content gaps: {grand_skipped}")
    print(f"Mode: {'DRY-RUN' if args.dry_run else 'APPLIED'}")
    if gap_brands:
        print("\nContent-gap brands (sorted by occurrence count):")
        for b, n in sorted(gap_brands.items(), key=lambda x: -x[1]):
            print(f"  {n}x  {b!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
