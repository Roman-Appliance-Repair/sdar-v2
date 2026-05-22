#!/usr/bin/env python3
"""
Wave 46 — P0 schema sweep round 2.

Closes the gap left by Wave 35 / commit d6768ea / Phase 2b-1: 375 pages
(334 brand combo + 41 price-list) did NOT receive the canonical org schema
(HVAC 777 LLC legalName + 4 hasCredential entries + OPENING_HOURS_SCHEMA).

This sweep ADDS a single new JSON-LD block per page named `wave46OrgSchema`
without modifying any existing schemaJsons. The block uses:
  - mergeCredentials()  from src/data/credentials-schema (legalName + 4 creds)
  - OPENING_HOURS_SCHEMA from src/data/business-hours (Mon-Sat 08:00-20:00 + Sun closed)

Also strips streetAddress / address PostalAddress blocks (geo-neutral pages
per docs/seo-policies.md §1 — only 6 pin pages should emit streetAddress).

Idempotency: skip files where `wave46OrgSchema` already declared.

Usage:
  python scripts/wave-46-p0-schema-round2.py --dry-run        # show diff for 3 samples
  python scripts/wave-46-p0-schema-round2.py --dry-run --all  # show all affected files (counts only)
  python scripts/wave-46-p0-schema-round2.py --write          # actually modify files
"""

from __future__ import annotations
import argparse
import difflib
import re
import sys
from pathlib import Path
from typing import Optional

REPO = Path(__file__).resolve().parents[1]
BRAND_DIR = REPO / "src" / "pages" / "brands"
PRICE_LIST_DIR = REPO / "src" / "pages" / "price-list"

# Marker used to detect that Wave 46 has already been applied (idempotency)
IDEMPOTENCY_MARKER = "wave46OrgSchema"

# Module-relative import paths used in different page depths
IMPORT_MERGE_CREDS_BRANDS = "import { mergeCredentials } from '../../data/credentials-schema';"
IMPORT_OPENING_HOURS_BRANDS = "import { OPENING_HOURS_SCHEMA } from '../../data/business-hours';"
IMPORT_MERGE_CREDS_PRICE = "import { mergeCredentials } from '../../data/credentials-schema';"
IMPORT_OPENING_HOURS_PRICE = "import { OPENING_HOURS_SCHEMA } from '../../data/business-hours';"

AREA_SERVED_BLOCK = (
    "  areaServed: [\n"
    "    { '@type': 'AdministrativeArea', name: 'Los Angeles County' },\n"
    "    { '@type': 'AdministrativeArea', name: 'Orange County' },\n"
    "    { '@type': 'AdministrativeArea', name: 'Ventura County' },\n"
    "    { '@type': 'AdministrativeArea', name: 'San Bernardino County' },\n"
    "    { '@type': 'AdministrativeArea', name: 'Riverside County' }\n"
    "  ]"
)


def url_from_path(astro_path: Path) -> str:
    """Derive page canonical URL from src/pages/... path."""
    rel = astro_path.relative_to(REPO / "src" / "pages").as_posix()
    rel = rel.removesuffix(".astro")
    if rel.endswith("/index"):
        rel = rel[:-len("/index")]
    return f"https://samedayappliance.repair/{rel}/"


def has_existing_canonical_const(frontmatter: str) -> Optional[str]:
    """Return canonical URL string if a `const canonical = "..."` is present, else None."""
    m = re.search(r"""const\s+canonical\s*=\s*['"]([^'"]+)['"]""", frontmatter)
    return m.group(1) if m else None


def has_import(frontmatter: str, module_substr: str) -> bool:
    """Check whether the frontmatter already imports from a given module substring."""
    pattern = re.compile(
        r"import\s+\{[^}]*\}\s+from\s+['\"][^'\"]*" + re.escape(module_substr) + r"['\"]"
    )
    return bool(pattern.search(frontmatter))


def add_import_after_last_import(frontmatter: str, new_import_line: str) -> str:
    """Insert new_import_line right after the last `import ...` line in frontmatter."""
    lines = frontmatter.splitlines(keepends=True)
    last_import_idx = -1
    for i, ln in enumerate(lines):
        if ln.lstrip().startswith("import "):
            last_import_idx = i
    if last_import_idx == -1:
        # No imports at all — insert at very top
        return new_import_line + "\n" + frontmatter
    lines.insert(last_import_idx + 1, new_import_line + "\n")
    return "".join(lines)


def build_wave46_const(canonical_url: str, canonical_var_present: bool) -> str:
    """Build the new const declaration for wave46OrgSchema."""
    # Use `canonical` variable if available in the file's scope, else hard-code URL string
    if canonical_var_present:
        url_expr_id = "canonical + '#org'"
        url_expr_self = "canonical"
    else:
        url_expr_id = f"'{canonical_url}#org'"
        url_expr_self = f"'{canonical_url}'"

    return (
        "\n"
        "// Wave 46 (2026-05-21): canonical org schema — HVAC 777 LLC + 4 credentials + hours.\n"
        "// Closes Wave 35 / Phase 2b-1 gap for brand-combo and price-list pages.\n"
        "// SSOT: src/data/credentials-schema.ts + src/data/business-hours.ts.\n"
        f"const {IDEMPOTENCY_MARKER} = mergeCredentials({{\n"
        "  '@context': 'https://schema.org',\n"
        "  '@type': 'HomeAndConstructionBusiness',\n"
        f"  '@id': {url_expr_id},\n"
        "  name: 'Same Day Appliance Repair',\n"
        f"  url: {url_expr_self},\n"
        "  priceRange: '$$',\n"
        "  openingHoursSpecification: OPENING_HOURS_SCHEMA,\n"
        f"{AREA_SERVED_BLOCK}\n"
        "});\n"
    )


def inject_const_into_frontmatter(frontmatter: str, new_const_block: str) -> str:
    """Append the new const block to the END of the frontmatter (just before closing ---)."""
    # The frontmatter is the text WITHOUT the surrounding `---` markers.
    # We append at the end with a trailing newline.
    if not frontmatter.endswith("\n"):
        frontmatter += "\n"
    return frontmatter + new_const_block


SCRIPT_TAG_TEMPLATE = (
    '<script type="application/ld+json" set:html={JSON.stringify(' + IDEMPOTENCY_MARKER + ')} />'
)

HEAD_FRAGMENT_OPEN_RE = re.compile(
    r'(<Fragment\s+slot=["\']head-scripts["\']\s*>)', re.IGNORECASE
)
LAYOUT_OPEN_RE = re.compile(
    r'(<Layout\b[^>]*>)', re.IGNORECASE
)


def inject_script_tag_into_body(body: str) -> str:
    """Inject the new script tag into <Fragment slot="head-scripts"> if present;
    otherwise create a new Fragment right after the opening <Layout ...> tag."""
    m = HEAD_FRAGMENT_OPEN_RE.search(body)
    if m:
        # Insert script tag right after the fragment opening
        insertion = m.group(1) + "\n  " + SCRIPT_TAG_TEMPLATE
        return body[: m.start()] + insertion + body[m.end():]

    # No existing Fragment — create one right after <Layout ...>
    m = LAYOUT_OPEN_RE.search(body)
    if not m:
        # No <Layout> wrapper — can't safely inject; skip
        return body
    insertion = (
        m.group(1)
        + "\n  <Fragment slot=\"head-scripts\">\n    "
        + SCRIPT_TAG_TEMPLATE
        + "\n  </Fragment>\n"
    )
    return body[: m.start()] + insertion + body[m.end():]


# --- streetAddress / PostalAddress / address blocks ---

ADDRESS_BLOCK_RE = re.compile(
    r"""
    ,?                                # optional leading comma (in JS object literal)
    \s*
    ['"]?address['"]?                  # "address" key (quoted or bare)
    \s*:\s*
    \{                                 # opening brace
        (?:[^{}]|\{[^{}]*\})*         # body (allow one level of nesting)
    \}
    """,
    re.VERBOSE | re.DOTALL,
)

STREET_ADDRESS_LINE_RE = re.compile(
    r"""['"]?streetAddress['"]?\s*:\s*['"][^'"]*['"]\s*,?\s*\n?""",
)


def strip_address_blocks(text: str) -> tuple[str, int]:
    """Strip `address: {...}` blocks AND lone `streetAddress: "..."` lines.

    Returns (new_text, count_removed).
    """
    count = 0
    new_text, n = ADDRESS_BLOCK_RE.subn("", text)
    count += n
    new_text, n = STREET_ADDRESS_LINE_RE.subn("", new_text)
    count += n
    return new_text, count


# --- main per-file transform ---

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


def transform_file(path: Path) -> tuple[str, dict]:
    """Apply Wave 46 sweep to a single file. Returns (new_content, stats)."""
    original = path.read_text(encoding="utf-8")
    stats = {
        "file": str(path.relative_to(REPO).as_posix()),
        "skipped": False,
        "reason": "",
        "added_import_merge": False,
        "added_import_hours": False,
        "added_const": False,
        "added_script_tag": False,
        "stripped_address": 0,
    }

    # Idempotency check
    if IDEMPOTENCY_MARKER in original:
        stats["skipped"] = True
        stats["reason"] = "already_swept"
        return original, stats

    # Parse frontmatter
    m = FRONTMATTER_RE.match(original)
    if not m:
        stats["skipped"] = True
        stats["reason"] = "no_frontmatter"
        return original, stats

    frontmatter = m.group(1)
    body = original[m.end():]

    # Determine import line (brand vs price-list — both ../../ in this repo)
    new_frontmatter = frontmatter

    if not has_import(new_frontmatter, "data/credentials-schema"):
        new_frontmatter = add_import_after_last_import(new_frontmatter, IMPORT_MERGE_CREDS_BRANDS)
        stats["added_import_merge"] = True

    if not has_import(new_frontmatter, "data/business-hours"):
        new_frontmatter = add_import_after_last_import(new_frontmatter, IMPORT_OPENING_HOURS_BRANDS)
        stats["added_import_hours"] = True

    # Build and inject the new const
    canonical_url = has_existing_canonical_const(new_frontmatter)
    canonical_var_present = canonical_url is not None
    if not canonical_url:
        canonical_url = url_from_path(path)

    new_const_block = build_wave46_const(canonical_url, canonical_var_present)
    new_frontmatter = inject_const_into_frontmatter(new_frontmatter, new_const_block)
    stats["added_const"] = True

    # Strip streetAddress / address blocks from frontmatter
    new_frontmatter, n_stripped = strip_address_blocks(new_frontmatter)
    stats["stripped_address"] += n_stripped

    # Inject script tag into body
    new_body = inject_script_tag_into_body(body)
    if new_body != body:
        stats["added_script_tag"] = True

    # Also strip address blocks from body just in case (some pages embed JSON in body)
    new_body, n_stripped_body = strip_address_blocks(new_body)
    stats["stripped_address"] += n_stripped_body

    new_content = "---\n" + new_frontmatter + "---\n" + new_body
    return new_content, stats


def collect_target_files() -> list[Path]:
    """Return sorted list of target .astro files (brand combos + price-list)."""
    brand_combos = sorted(BRAND_DIR.glob("*-repair.astro"))
    price_list = sorted(PRICE_LIST_DIR.glob("*.astro"))
    return brand_combos + price_list


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Show diffs without writing")
    ap.add_argument("--write", action="store_true", help="Actually modify files")
    ap.add_argument("--all", action="store_true", help="In dry-run, summarize all files (no diffs)")
    ap.add_argument("--samples", type=int, default=3, help="Number of sample diffs to show in dry-run (default 3)")
    args = ap.parse_args()

    if not (args.dry_run or args.write):
        print("ERROR: choose --dry-run or --write", file=sys.stderr)
        return 2

    files = collect_target_files()
    print(f"Targeting {len(files)} .astro files "
          f"({len(list(BRAND_DIR.glob('*-repair.astro')))} brand combo + "
          f"{len(list(PRICE_LIST_DIR.glob('*.astro')))} price-list)")
    print()

    totals = {
        "files_total": len(files),
        "files_changed": 0,
        "files_skipped_already": 0,
        "files_skipped_other": 0,
        "imports_added": 0,
        "const_added": 0,
        "script_tag_added": 0,
        "address_stripped": 0,
    }
    samples_shown = 0
    skipped_reasons: dict[str, int] = {}

    for fp in files:
        original = fp.read_text(encoding="utf-8")
        new_content, stats = transform_file(fp)

        if stats["skipped"]:
            if stats["reason"] == "already_swept":
                totals["files_skipped_already"] += 1
            else:
                totals["files_skipped_other"] += 1
                skipped_reasons[stats["reason"]] = skipped_reasons.get(stats["reason"], 0) + 1
            continue

        totals["files_changed"] += 1
        if stats["added_import_merge"]: totals["imports_added"] += 1
        if stats["added_import_hours"]: totals["imports_added"] += 1
        if stats["added_const"]: totals["const_added"] += 1
        if stats["added_script_tag"]: totals["script_tag_added"] += 1
        totals["address_stripped"] += stats["stripped_address"]

        if args.dry_run and not args.all and samples_shown < args.samples:
            samples_shown += 1
            print(f"\n========== SAMPLE DIFF #{samples_shown}: {stats['file']} ==========")
            diff = difflib.unified_diff(
                original.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f"a/{stats['file']}",
                tofile=f"b/{stats['file']}",
                n=2,
            )
            sys.stdout.writelines(diff)
            print()

        if args.write:
            fp.write_text(new_content, encoding="utf-8")

    print("\n========== SUMMARY ==========")
    for k, v in totals.items():
        print(f"  {k}: {v}")
    if skipped_reasons:
        print("  skipped_reasons:")
        for reason, n in skipped_reasons.items():
            print(f"    {reason}: {n}")
    if args.write:
        print("\nWritten to disk. Run `npm run build` next.")
    elif args.dry_run:
        print("\nDry run only. Re-run with --write to apply.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
