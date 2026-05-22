"""Wave 47 — Full schema compliance sweep (2026-05-22).

Closes Phase 2b-2 backlog: brings 392 gap pages from missing schema fields
to full compliance with seo-policies.md §1-3 (legalName + hasCredential[4] +
openingHoursSpecification + telephone). Net-zero word count on visible body.

Strategy: per-file pattern detection + surgical injection. 9 patterns:
  A — brand_pillar `schemaJsons[0].provider`
  B — service_hub `JSON.stringify({...provider...})`
  C — separate `LocalBusiness@id` + Service@id ref
  D — raw `<script type="application/ld+json">` inline JSON
  E — BlogLayout shared component (one edit, 21 blog pages)
  F — price_list `mergeCredentials()` already used, add `telephone`
  G — book.astro add `openingHoursSpecification`
  H — credentials/* template-literal LB
  I — privacy/terms/credentials-index add full pin schema from scratch

Idempotent: re-running is safe (every injection checks for existing field).

Usage:
  python scripts/wave-47-schema-completion.py --dry-run
  python scripts/wave-47-schema-completion.py --write
"""
import argparse
import csv
import re
import sys
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parent.parent
GAP_CSV = ROOT / "scripts" / "audit-schema-2026-05-22" / "gap-with-files.csv"

# Canonical fields/imports inserted as needed
CRED_IMPORT_NAMED = "import { mergeCredentials } from"
OHRS_IMPORT_NAMED = "import { OPENING_HOURS_SCHEMA } from"
MAIN_PHONE_IMPORT_NAMED = "MAIN_PHONE"

# Canonical canonical pin schema fragment (used for Pattern I privacy/terms/credentials-index)
# Note: streetAddress canonical form per seo-policies.md §1 = "8746 Rangely Ave Ste"
PIN_LB_PIECE = """\
const wave47PinSchema = mergeCredentials({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': canonical + '#business',
  name: 'Same Day Appliance Repair',
  url: canonical,
  telephone: '+1-323-870-4790',
  email: 'support@samedayappliance.repair',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '8746 Rangely Ave Ste',
    addressLocality: 'West Hollywood',
    addressRegion: 'CA',
    postalCode: '90048',
    addressCountry: 'US'
  },
  openingHoursSpecification: OPENING_HOURS_SCHEMA,
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Los Angeles County' },
    { '@type': 'AdministrativeArea', name: 'Orange County' },
    { '@type': 'AdministrativeArea', name: 'Ventura County' },
    { '@type': 'AdministrativeArea', name: 'San Bernardino County' },
    { '@type': 'AdministrativeArea', name: 'Riverside County' }
  ]
});"""


def find_matching_brace(text: str, open_pos: int) -> int:
    """Given index of '{' at open_pos, return index of matching '}' (or -1).
    Tracks string literals (single/double/backtick) and escapes."""
    assert text[open_pos] == "{"
    depth = 0
    i = open_pos
    n = len(text)
    in_str = None  # None, "'", '"', or '`'
    while i < n:
        ch = text[i]
        if in_str is None:
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return i
            elif ch in ("'", '"', '`'):
                in_str = ch
            elif ch == "/" and i + 1 < n and text[i+1] == "/":
                # line comment
                nl = text.find("\n", i)
                i = n if nl < 0 else nl
                continue
            elif ch == "/" and i + 1 < n and text[i+1] == "*":
                end = text.find("*/", i+2)
                i = n if end < 0 else end + 2
                continue
        else:
            if ch == "\\":
                i += 2
                continue
            if ch == in_str:
                in_str = None
        i += 1
    return -1


def find_lb_objects(text: str) -> list[tuple[int, int]]:
    """Find all top-level LocalBusiness-ish objects.

    Heuristic: search for `"@type": "LocalBusiness"` or
    `"@type": "HomeAndConstructionBusiness"` or
    `'@type': 'LocalBusiness'` (any quote style), then walk backwards
    to the enclosing `{` and forwards to its matching `}`.
    """
    pat = re.compile(
        r"""['"]@type['"]\s*:\s*['"](LocalBusiness|HomeAndConstructionBusiness)['"]""",
        re.IGNORECASE,
    )
    seen = set()
    out = []
    for m in pat.finditer(text):
        # walk backwards to find enclosing {
        i = m.start() - 1
        depth = 0
        in_str = None
        while i >= 0:
            ch = text[i]
            if in_str is None:
                if ch == "}":
                    depth += 1
                elif ch == "{":
                    if depth == 0:
                        break
                    depth -= 1
                elif ch in ("'", '"', '`'):
                    in_str = ch
            else:
                if i > 0 and text[i-1] == "\\":
                    i -= 2
                    continue
                if ch == in_str:
                    in_str = None
            i -= 1
        if i < 0 or text[i] != "{":
            continue
        end = find_matching_brace(text, i)
        if end < 0:
            continue
        if (i, end) not in seen:
            seen.add((i, end))
            out.append((i, end))
    out.sort()
    return out


def find_provider_objects(text: str) -> list[tuple[int, int]]:
    """Find `"provider": { ... }` objects (Pattern A + B)."""
    pat = re.compile(r"""['"]provider['"]\s*:\s*\{""")
    out = []
    for m in pat.finditer(text):
        brace_pos = m.end() - 1
        end = find_matching_brace(text, brace_pos)
        if end < 0:
            continue
        out.append((brace_pos, end))
    return out


def detect_indent(text: str, brace_pos: int) -> str:
    """Detect indent inside the object — use indent of first non-blank line after `{`."""
    i = brace_pos + 1
    while i < len(text) and text[i] in " \t":
        i += 1
    if i < len(text) and text[i] == "\n":
        # multi-line object — look at the first child line
        j = i + 1
        while j < len(text) and text[j] in " \t":
            j += 1
        return text[i+1:j]
    return "  "


def is_compact(text: str, brace_open: int, brace_close: int) -> bool:
    """Object is on a single line (no newline between braces)."""
    return "\n" not in text[brace_open:brace_close]


def inject_fields_into_object(text: str, brace_open: int, brace_close: int,
                              fields_to_add: dict[str, str]) -> str:
    """Insert key:value pairs just before the closing brace.
    fields_to_add: { 'key_name': 'value_expression_as_string' }
    Detects quoting style (double quotes vs single) from existing keys.
    Returns updated text. Skips fields that already exist in the object body.
    """
    body = text[brace_open:brace_close+1]
    if not fields_to_add:
        return text

    # determine quoting style by looking at existing first key
    key_quote = '"'
    m = re.search(r"""([{,]\s*)(['"])([@a-zA-Z_][\w@]*)\2\s*:""", body)
    if m:
        key_quote = m.group(2)

    # filter out already-present fields
    to_add = {}
    for k, v in fields_to_add.items():
        # check both quote styles
        pat = re.compile(rf"""['"]({re.escape(k)})['"]\s*:""")
        if not pat.search(body):
            to_add[k] = v
    if not to_add:
        return text

    indent = detect_indent(text, brace_open)
    compact = is_compact(text, brace_open, brace_close)

    # Find insertion point: just before closing brace.
    # We need to also handle whether there's a trailing comma/newline at the end.
    insert_pos = brace_close
    # walk back over whitespace to find last non-ws char
    j = brace_close - 1
    while j > brace_open and text[j] in " \t\n":
        j -= 1
    needs_leading_comma = text[j] not in "{,"

    pieces = []
    if compact:
        # single-line object — insert with comma-space separation
        for k, v in to_add.items():
            pieces.append(f"{key_quote}{k}{key_quote}: {v}")
        joined = ", ".join(pieces)
        if needs_leading_comma:
            inject = ", " + joined
        else:
            inject = " " + joined
        # ensure trailing space before }
        new_text = text[:insert_pos] + inject + " " + text[insert_pos:]
        # remove our injected leading space if redundant
        if text[insert_pos-1] == " ":
            # already a space before }
            new_text = text[:insert_pos] + inject + text[insert_pos:]
        return new_text
    else:
        # multi-line object — newline-separated
        # Each new field line ends with ',' so successive fields chain
        # correctly. Trailing comma before `}` is valid in JS object
        # literals (these are JS expressions passed to JSON.stringify,
        # not raw JSON parses).
        insert_lines = []
        if needs_leading_comma:
            insert_lines.append(",")
        items = list(to_add.items())
        for idx, (k, v) in enumerate(items):
            sep = "," if idx < len(items) - 1 else ""
            insert_lines.append(f"\n{indent}{key_quote}{k}{key_quote}: {v}{sep}")
        inject = "".join(insert_lines)
        return text[:j+1] + inject + text[j+1:]


def has_field(text: str, brace_open: int, brace_close: int, field: str) -> bool:
    body = text[brace_open:brace_close+1]
    pat = re.compile(rf"""['"]({re.escape(field)})['"]\s*:""")
    return bool(pat.search(body))


# Canonical inserted value strings (JS expressions safe to inject)
CREDS_ARRAY_INLINE = (
    "[ "
    '{ "@type": "EducationalOccupationalCredential", "credentialCategory": "BHGS Registration #A49573", '
    '"recognizedBy": { "@type": "GovernmentOrganization", "name": "California Bureau of Household Goods and Services" } }, '
    '{ "@type": "EducationalOccupationalCredential", "credentialCategory": "EPA 608 Universal Certification #1346255700410", '
    '"recognizedBy": { "@type": "GovernmentOrganization", "name": "U.S. Environmental Protection Agency" } }, '
    '{ "@type": "EducationalOccupationalCredential", "credentialCategory": "CSLB C-20 HVAC", '
    '"recognizedBy": { "@type": "GovernmentOrganization", "name": "California Contractors State License Board" } }, '
    '{ "@type": "EducationalOccupationalCredential", "credentialCategory": "BBB Accredited Business", '
    '"recognizedBy": { "@type": "Organization", "name": "Better Business Bureau" } } '
    "]"
)
HOURS_ARRAY_INLINE = (
    "[ "
    '{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], "opens": "08:00", "closes": "20:00" }, '
    '{ "@type": "OpeningHoursSpecification", "dayOfWeek": "Sunday", "opens": "00:00", "closes": "00:00" } '
    "]"
)


def ensure_lb_complete(text: str) -> tuple[str, dict]:
    """Pass 1: for every LocalBusiness object in `text`, ensure it has
    legalName + hasCredential + openingHoursSpecification + (if provider) telephone.

    Returns (new_text, stats_dict).
    """
    stats = Counter()
    # We iterate from the END backwards so positions don't shift after edits.
    lb_positions = find_lb_objects(text)
    if not lb_positions:
        return text, stats

    for (br_open, br_close) in reversed(lb_positions):
        missing = {}
        if not has_field(text, br_open, br_close, "legalName"):
            missing["legalName"] = '"HVAC 777 LLC"'
            stats["legalName_added"] += 1
        if not has_field(text, br_open, br_close, "hasCredential"):
            missing["hasCredential"] = CREDS_ARRAY_INLINE
            stats["hasCredential_added"] += 1
        if not has_field(text, br_open, br_close, "openingHoursSpecification"):
            missing["openingHoursSpecification"] = HOURS_ARRAY_INLINE
            stats["openingHoursSpecification_added"] += 1
        if missing:
            text = inject_fields_into_object(text, br_open, br_close, missing)
            stats["lb_blocks_touched"] += 1
    return text, stats


def ensure_provider_complete(text: str) -> tuple[str, dict]:
    """Pass 2: for every `provider` object, ensure it has legalName +
    hasCredential. Hours are also added if absent and the object looks
    substantive (has telephone or url). Note this may double-process LBs
    already touched by ensure_lb_complete, but injection is idempotent.

    Skip provider objects that are merely `@id` references like
    `{ "@id": "..." }` (Pattern C/D) — those reference a sibling LB block
    that we've already fixed.
    """
    stats = Counter()
    prov_positions = find_provider_objects(text)
    if not prov_positions:
        return text, stats

    for (br_open, br_close) in reversed(prov_positions):
        body = text[br_open:br_close+1]
        # If body is ONLY @id reference, skip
        if re.fullmatch(r"\{\s*['\"]@id['\"]\s*:\s*[^{}]+?\s*\}", body):
            continue
        # If body has no @type at all, skip (probably already @id ref)
        if "@type" not in body and "telephone" not in body and "name" not in body:
            continue
        missing = {}
        if not has_field(text, br_open, br_close, "legalName"):
            missing["legalName"] = '"HVAC 777 LLC"'
            stats["legalName_added"] += 1
        if not has_field(text, br_open, br_close, "hasCredential"):
            missing["hasCredential"] = CREDS_ARRAY_INLINE
            stats["hasCredential_added"] += 1
        if not has_field(text, br_open, br_close, "openingHoursSpecification"):
            missing["openingHoursSpecification"] = HOURS_ARRAY_INLINE
            stats["openingHoursSpecification_added"] += 1
        if missing:
            text = inject_fields_into_object(text, br_open, br_close, missing)
            stats["provider_blocks_touched"] += 1
    return text, stats


# ───────────────────── Pattern-specific handlers ─────────────────────

def fix_price_list(path: Path, text: str) -> tuple[str, dict]:
    """Pattern F: price-list pages have wave46OrgSchema = mergeCredentials({...})
    but no `telephone` field. Inject telephone: MAIN_PHONE and add import."""
    stats = Counter()
    if "wave46OrgSchema" not in text and "wave47OrgSchema" not in text:
        return text, stats
    # find the mergeCredentials({ ... }) call after wave46OrgSchema definition
    m = re.search(r"const\s+wave4[67]OrgSchema\s*=\s*mergeCredentials\(\s*\{", text)
    if not m:
        return text, stats
    brace_pos = m.end() - 1
    end = find_matching_brace(text, brace_pos)
    if end < 0:
        return text, stats
    if has_field(text, brace_pos, end, "telephone"):
        return text, stats

    # ensure MAIN_PHONE import
    if "MAIN_PHONE" not in text:
        # add import line after first existing import from '...branches'
        if "from '../../data/branches'" in text:
            text = re.sub(
                r"(import\s+\{\s*)([^}]*?)(\s*\}\s+from\s+'\.\./\.\./data/branches';)",
                lambda mm: mm.group(1) + mm.group(2).rstrip().rstrip(",") + ", MAIN_PHONE" + mm.group(3),
                text, count=1,
            )
            stats["imports_main_phone_extended"] += 1
        else:
            # insert new import after mergeCredentials import
            text = text.replace(
                "import { mergeCredentials } from '../../data/credentials-schema';",
                "import { mergeCredentials } from '../../data/credentials-schema';\nimport { MAIN_PHONE } from '../../data/branches';",
                1,
            )
            stats["imports_main_phone_added"] += 1
        # positions may have shifted — re-find
        m = re.search(r"const\s+wave4[67]OrgSchema\s*=\s*mergeCredentials\(\s*\{", text)
        brace_pos = m.end() - 1
        end = find_matching_brace(text, brace_pos)

    text = inject_fields_into_object(text, brace_pos, end, {"telephone": "MAIN_PHONE"})
    stats["telephone_added"] += 1
    return text, stats


def fix_book(path: Path, text: str) -> tuple[str, dict]:
    """Pattern G: book.astro localBusinessSchema missing openingHoursSpecification."""
    stats = Counter()
    m = re.search(r"const\s+localBusinessSchema\s*=\s*mergeCredentials\(\s*\{", text)
    if not m:
        return text, stats
    brace_pos = m.end() - 1
    end = find_matching_brace(text, brace_pos)
    if end < 0 or has_field(text, brace_pos, end, "openingHoursSpecification"):
        return text, stats
    # ensure OPENING_HOURS_SCHEMA import
    if "OPENING_HOURS_SCHEMA" not in text:
        text = text.replace(
            "import { mergeCredentials } from '../data/credentials-schema';",
            "import { mergeCredentials } from '../data/credentials-schema';\nimport { OPENING_HOURS_SCHEMA } from '../data/business-hours';",
            1,
        )
        stats["imports_ohrs_added"] += 1
        m = re.search(r"const\s+localBusinessSchema\s*=\s*mergeCredentials\(\s*\{", text)
        brace_pos = m.end() - 1
        end = find_matching_brace(text, brace_pos)
    text = inject_fields_into_object(text, brace_pos, end, {"openingHoursSpecification": "OPENING_HOURS_SCHEMA"})
    stats["hours_added"] += 1
    return text, stats


def fix_pin_legal_page(path: Path, text: str) -> tuple[str, dict]:
    """Pattern I: privacy-policy.astro + terms.astro + credentials/index.astro
    have NO LocalBusiness schema. Add wave47PinSchema = mergeCredentials({...})
    block, import helpers, and emit in Fragment slot."""
    stats = Counter()
    if "wave47PinSchema" in text:
        return text, stats

    # ensure imports
    has_layout = "from '../layouts/Layout.astro'" in text or 'from "../layouts/Layout.astro"' in text
    # determine import path depth: privacy-policy/terms = '../', credentials/index = '../../'
    depth = "../" if has_layout else "../../"

    # add helper imports near top
    imports_inserted = False
    layout_import_pat = re.compile(r"(import\s+Layout\s+from\s+['\"][^'\"]+Layout\.astro['\"]\s*;)")
    if layout_import_pat.search(text):
        text, n = layout_import_pat.subn(
            lambda mm: mm.group(1)
                       + f"\nimport {{ mergeCredentials }} from '{depth}data/credentials-schema';"
                       + f"\nimport {{ OPENING_HOURS_SCHEMA }} from '{depth}data/business-hours';",
            text, count=1,
        )
        imports_inserted = n > 0
        stats["imports_added_pin"] += n

    # inject wave47PinSchema constant before frontmatter close (---)
    # find first --- at column 0
    m_close = re.search(r"^---\s*$", text, re.MULTILINE)
    if not m_close:
        return text, stats
    second_m = list(re.finditer(r"^---\s*$", text, re.MULTILINE))
    if len(second_m) < 2:
        return text, stats
    second_dash_start = second_m[1].start()
    insertion = f"\n{PIN_LB_PIECE}\n"
    text = text[:second_dash_start] + insertion + text[second_dash_start:]
    stats["pin_schema_const_added"] += 1

    # emit the schema in head-scripts Fragment OR before existing scripts
    if "<Fragment slot=\"head-scripts\">" in text:
        text = text.replace(
            "<Fragment slot=\"head-scripts\">",
            "<Fragment slot=\"head-scripts\">\n    <script type=\"application/ld+json\" set:html={JSON.stringify(wave47PinSchema)} />",
            1,
        )
        stats["pin_schema_emit_added"] += 1
    else:
        # fallback: inject right after <Layout ...> open tag
        m_layout = re.search(r"(<Layout[^>]*>)", text)
        if m_layout:
            text = text[:m_layout.end()] + "\n  <Fragment slot=\"head-scripts\">\n    <script type=\"application/ld+json\" set:html={JSON.stringify(wave47PinSchema)} />\n  </Fragment>" + text[m_layout.end():]
            stats["pin_schema_emit_added"] += 1
    return text, stats


def fix_blog_layout(path: Path, text: str) -> tuple[str, dict]:
    """Pattern E: src/layouts/BlogLayout.astro — inject LocalBusiness schema
    that emits site-wide on all blog pages."""
    stats = Counter()
    if "wave47BlogLb" in text:
        return text, stats
    # ensure imports
    if "mergeCredentials" not in text:
        text = text.replace(
            "import Layout from './Layout.astro';",
            "import Layout from './Layout.astro';\nimport { mergeCredentials } from '../data/credentials-schema';\nimport { OPENING_HOURS_SCHEMA } from '../data/business-hours';",
            1,
        )
        stats["imports_added_blog"] += 1
    # add wave47BlogLb constant before second --- (frontmatter close)
    pin_block = """\
const wave47BlogLb = mergeCredentials({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://samedayappliance.repair/#business',
  name: 'Same Day Appliance Repair',
  url: 'https://samedayappliance.repair/',
  telephone: '+1-424-325-0520',
  priceRange: '$$',
  openingHoursSpecification: OPENING_HOURS_SCHEMA,
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Los Angeles County' },
    { '@type': 'AdministrativeArea', name: 'Orange County' },
    { '@type': 'AdministrativeArea', name: 'Ventura County' },
    { '@type': 'AdministrativeArea', name: 'San Bernardino County' },
    { '@type': 'AdministrativeArea', name: 'Riverside County' }
  ]
});"""
    second_m = list(re.finditer(r"^---\s*$", text, re.MULTILINE))
    if len(second_m) < 2:
        return text, stats
    second_dash_start = second_m[1].start()
    text = text[:second_dash_start] + "\n" + pin_block + "\n" + text[second_dash_start:]
    stats["blog_lb_const_added"] += 1
    # emit in head-scripts Fragment
    if "<Fragment slot=\"head-scripts\">" in text:
        text = text.replace(
            "<Fragment slot=\"head-scripts\">",
            "<Fragment slot=\"head-scripts\">\n  <script type=\"application/ld+json\" set:html={JSON.stringify(wave47BlogLb)} />",
            1,
        )
        stats["blog_lb_emit_added"] += 1
    return text, stats


def fix_generic_no_lb_page(rel_path: Path, text: str) -> tuple[str, dict]:
    """Pattern J: pages with no LocalBusiness schema at all (e.g. brands/index,
    blog/index, ai-diagnostic, areas/index, for-business/index). Inject
    wave47GeoNeutralLb constant + emit script under <Layout> open tag."""
    stats = Counter()
    if "wave47GeoNeutralLb" in text:
        return text, stats

    # Determine import depth based on file location
    parts = rel_path.parts
    if parts[0] == "src" and parts[1] == "pages":
        depth = len(parts) - 3  # src/pages/<...> ; depth = N up to reach 'data/'
        # src/pages/ai-diagnostic.astro → depth 0 → '../data/'
        # src/pages/areas/index.astro → depth 1 → '../../data/'
        # src/pages/blog/index.astro → depth 1
        # src/pages/brands/index.astro → depth 1
        # src/pages/for-business/index.astro → depth 1
        depth_prefix = "../" * (depth + 1)
    else:
        return text, stats

    # ensure imports
    layout_import_pat = re.compile(r"(import\s+Layout\s+from\s+['\"][^'\"]+Layout\.astro['\"]\s*;)")
    if layout_import_pat.search(text):
        text, n = layout_import_pat.subn(
            lambda mm: mm.group(1)
                       + f"\nimport {{ mergeCredentials }} from '{depth_prefix}data/credentials-schema';"
                       + f"\nimport {{ OPENING_HOURS_SCHEMA }} from '{depth_prefix}data/business-hours';",
            text, count=1,
        )
        if n == 0:
            return text, stats
        stats["imports_added_generic"] += 1
    else:
        return text, stats

    # add wave47GeoNeutralLb constant inside frontmatter
    pin_block = """
const wave47GeoNeutralLb = mergeCredentials({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://samedayappliance.repair/#business',
  name: 'Same Day Appliance Repair',
  url: 'https://samedayappliance.repair/',
  telephone: '+1-424-325-0520',
  priceRange: '$$',
  openingHoursSpecification: OPENING_HOURS_SCHEMA,
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Los Angeles County' },
    { '@type': 'AdministrativeArea', name: 'Orange County' },
    { '@type': 'AdministrativeArea', name: 'Ventura County' },
    { '@type': 'AdministrativeArea', name: 'San Bernardino County' },
    { '@type': 'AdministrativeArea', name: 'Riverside County' }
  ]
});"""
    second_m = list(re.finditer(r"^---\s*$", text, re.MULTILINE))
    if len(second_m) < 2:
        return text, stats
    second_dash_start = second_m[1].start()
    text = text[:second_dash_start] + pin_block + "\n" + text[second_dash_start:]
    stats["generic_lb_const_added"] += 1

    # emit script after first <Layout ...> opening tag
    m_layout = re.search(r"(<Layout[^>]*>)", text)
    if m_layout:
        emit = "\n  <Fragment slot=\"head-scripts\">\n    <script type=\"application/ld+json\" set:html={JSON.stringify(wave47GeoNeutralLb)} />\n  </Fragment>"
        text = text[:m_layout.end()] + emit + text[m_layout.end():]
        stats["generic_lb_emit_added"] += 1
    return text, stats


# ───────────────────── Main file processor ─────────────────────

def process_file(rel_path: Path, write: bool) -> dict:
    """Run all applicable transforms on a file. Returns stats."""
    full = ROOT / rel_path
    text = full.read_text(encoding="utf-8")
    orig = text
    stats = Counter()

    # Special files first
    if rel_path == Path("src/pages/book.astro"):
        text, s = fix_book(full, text)
        stats.update(s)
        stats["category"] = "book"
    elif rel_path == Path("src/pages/privacy-policy.astro") or rel_path == Path("src/pages/terms.astro"):
        text, s = fix_pin_legal_page(full, text)
        stats.update(s)
        stats["category"] = "pin_legal"
    elif rel_path == Path("src/pages/credentials/index.astro"):
        text, s = fix_pin_legal_page(full, text)
        stats.update(s)
        stats["category"] = "pin_legal"
    elif "src/pages/price-list/" in str(rel_path).replace("\\", "/"):
        # price-list pages already use mergeCredentials() wrapper — that injects
        # legalName + hasCredential at runtime. Only telephone is missing.
        # DO NOT run general LB sweep — it would duplicate fields inside the
        # inner object that mergeCredentials() then overrides anyway.
        text, s = fix_price_list(full, text)
        stats.update(s)
        stats["category"] = "price_list"
    else:
        # General sweep: every LB block + every provider block
        text, s = ensure_lb_complete(text)
        stats.update(s)
        text, s = ensure_provider_complete(text)
        stats.update(s)
        # Fallback: page had no LB and no provider sweep matched.
        # Apply only to a known whitelist of hub/landing pages.
        rel_str = str(rel_path).replace("\\", "/")
        no_lb_whitelist = {
            "src/pages/ai-diagnostic.astro",
            "src/pages/areas/index.astro",
            "src/pages/for-business/index.astro",
            "src/pages/brands/index.astro",
            "src/pages/blog/index.astro",
        }
        if (rel_str in no_lb_whitelist
                and stats.get("lb_blocks_touched", 0) == 0
                and stats.get("provider_blocks_touched", 0) == 0):
            text, s = fix_generic_no_lb_page(rel_path, text)
            stats.update(s)
            stats["category_extra"] = "generic_no_lb"

    changed = text != orig
    if changed and write:
        full.write_text(text, encoding="utf-8")
    stats["changed"] = 1 if changed else 0
    return stats, orig, text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--sample-diffs", type=int, default=5)
    args = ap.parse_args()

    if args.write and args.dry_run:
        print("ERROR: --dry-run and --write are mutually exclusive", file=sys.stderr)
        sys.exit(2)
    if not args.write:
        args.dry_run = True

    # load gap list
    with GAP_CSV.open(encoding="utf-8") as f:
        gaps = list(csv.DictReader(f))
    src_files = sorted({Path(g["src_file"]) for g in gaps if g["src_file"]})

    # Always also touch BlogLayout (Pattern E) — it's not in gap-list (it's a layout)
    blog_layout = Path("src/layouts/BlogLayout.astro")

    print(f"Wave 47 sweep — mode: {'DRY-RUN' if args.dry_run else 'WRITE'}")
    print(f"  Source files to process: {len(src_files)} (+ 1 BlogLayout)")
    print()

    overall = Counter()
    per_cat = defaultdict(Counter)
    samples = []
    errors = []

    # Process BlogLayout first
    try:
        bl_full = ROOT / blog_layout
        bl_text = bl_full.read_text(encoding="utf-8")
        bl_new, bl_stats = fix_blog_layout(bl_full, bl_text)
        overall.update(bl_stats)
        if bl_new != bl_text:
            if args.write:
                bl_full.write_text(bl_new, encoding="utf-8")
            samples.append(("BlogLayout.astro", bl_text, bl_new))
            print(f"  BlogLayout.astro: {dict(bl_stats)} → {'WROTE' if args.write else 'would write'}")
    except Exception as e:
        errors.append((str(blog_layout), str(e)))

    # cat map for reporting
    cat_map = {Path(g["src_file"]): g["category"] for g in gaps if g["src_file"]}

    for rel in src_files:
        # skip BlogLayout (already done)
        if rel == blog_layout:
            continue
        try:
            stats, orig, new = process_file(rel, args.write)
        except Exception as e:
            errors.append((str(rel), f"{type(e).__name__}: {e}"))
            continue
        cat = cat_map.get(rel, "?")
        per_cat[cat]["count"] += 1
        for k, v in stats.items():
            if k == "category":
                continue
            if isinstance(v, int):
                overall[k] += v
                per_cat[cat][k] += v
        if stats.get("changed") and len(samples) < args.sample_diffs + 5:
            samples.append((str(rel), orig, new))

    print()
    print("=" * 70)
    print(f"FILES PROCESSED:       {len(src_files) + 1}")
    print(f"FILES CHANGED:         {overall['changed']}")
    print(f"FILES UNCHANGED:       {len(src_files) + 1 - overall['changed']}")
    print(f"ERRORS:                {len(errors)}")
    print()
    print("Per-category result:")
    for cat in sorted(per_cat):
        s = per_cat[cat]
        print(f"  {cat:24s} n={s['count']:>4}  changed={s['changed']:>4}  "
              f"lb_blocks={s['lb_blocks_touched']:>4}  provider_blocks={s['provider_blocks_touched']:>4}")
    print()
    print("Aggregate field injections:")
    for k in ["legalName_added","hasCredential_added","openingHoursSpecification_added",
              "telephone_added","lb_blocks_touched","provider_blocks_touched",
              "imports_main_phone_extended","imports_main_phone_added","imports_ohrs_added",
              "imports_added_pin","imports_added_blog",
              "pin_schema_const_added","pin_schema_emit_added","blog_lb_const_added","blog_lb_emit_added"]:
        if overall[k]:
            print(f"  {k:36s} {overall[k]}")
    if errors:
        print()
        print("ERRORS encountered:")
        for path, msg in errors[:20]:
            print(f"  {path}: {msg}")
        if len(errors) > 20:
            print(f"  ... and {len(errors)-20} more")

    if args.dry_run:
        print()
        print(f"--- {min(args.sample_diffs, len(samples))} sample diffs ---")
        for path, orig, new in samples[:args.sample_diffs]:
            print(f"\n>>> {path} >>>")
            from difflib import unified_diff
            diff = list(unified_diff(orig.splitlines(keepends=True),
                                     new.splitlines(keepends=True),
                                     lineterm=""))
            for line in diff[:50]:
                print(line.rstrip())
            if len(diff) > 50:
                print(f"...({len(diff)-50} more diff lines)")


if __name__ == "__main__":
    main()
