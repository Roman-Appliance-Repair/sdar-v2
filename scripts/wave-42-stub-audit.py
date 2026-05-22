"""Wave 42 — Stub audit. Find pages <200 body words. Read-only.

Counts words from BOTH:
  1. String literals in frontmatter (props content for v2 components)
  2. Plain text in template body (non-tag, non-expression)

Excludes: imports, schema/JSON-LD strings, attribute-only strings (alt, src, slug, icon emoji).
"""
import re, pathlib, json
from collections import Counter

ROOT = pathlib.Path('src/pages/')

SKIP_PATTERNS = [
    'index.astro',
    '404.astro',
    'sitemap',
    'search.astro',
    '[city]',
    '[service]',
]

# Frontmatter keys whose string values are NOT body content (metadata/schema/code).
META_KEYS = {
    'title','description','canonical','citySlug','cityName','phoneRaw','phone',
    'icon','slug','href','url','src','alt','image','email','telephone',
    'addressLocality','addressRegion','postalCode','addressCountry','streetAddress',
    'priceRange','license','sameAs','category','priority','changefreq','lastmod',
    'name','@type','@context','dayOfWeek','opens','closes','ratingValue',
    'reviewCount','bestRating','telephone','currency','priceCurrency','offerType',
    'areaServed','identifier','knowsAbout',
}

WORD_PATTERN = re.compile(r"[A-Za-z][A-Za-z'\-]*")  # English word tokens only


def count_words_in_string(s: str) -> int:
    # Strip HTML tags inside string (e.g. <a href...>...</a>)
    s = re.sub(r'<[^>]+>', ' ', s)
    return len(WORD_PATTERN.findall(s))


def extract_frontmatter_content_words(frontmatter: str) -> int:
    """Walk frontmatter line by line. For each `key: "..."` or `key: '...'` or
    template literal assignment, decide if it's content (count) or metadata (skip).
    Also count strings inside arrays/objects defined for content props.
    """
    words = 0

    # Strategy: find ALL string literals in frontmatter.
    # For each, decide whether to count based on context.
    # Heuristic: strings ≥ 30 chars OR containing 6+ words → likely body content.
    # Short strings → likely metadata, skipped.

    # Match string literals: "...", '...', `...` (allowing escaped quotes inside)
    string_re = re.compile(
        r'"((?:[^"\\]|\\.)*)"' r"|"
        r"'((?:[^'\\]|\\.)*)'" r"|"
        r"`((?:[^`\\]|\\.)*)`",
        re.DOTALL,
    )

    for m in string_re.finditer(frontmatter):
        s = m.group(1) or m.group(2) or m.group(3) or ''
        if not s:
            continue
        # Skip very short metadata-like strings
        wc = count_words_in_string(s)
        if wc < 4:
            continue
        # Skip if looks like a URL/path/email/phone
        if re.match(r'^(https?:|tel:|mailto:|/[a-z0-9\-/]+/?|\+?\d[\d\-\(\) ]+)$', s.strip()):
            continue
        # Skip schema.org type tokens
        if s.strip().startswith('@') or s.strip().startswith('schema.org'):
            continue
        words += wc

    return words


def extract_template_text_words(template: str) -> int:
    """Plain text words rendered directly in template (not inside expressions/tags)."""
    # Remove script & style blocks
    t = re.sub(r'<script[^>]*>.*?</script>', ' ', template, flags=re.DOTALL)
    t = re.sub(r'<style[^>]*>.*?</style>', ' ', t, flags=re.DOTALL)
    # Remove JSX expressions {...} (single-level only — matches most cases)
    t = re.sub(r'\{[^{}]*\}', ' ', t)
    # Drop tags
    t = re.sub(r'<[^>]+>', ' ', t)
    return len(WORD_PATTERN.findall(t))


def split_frontmatter(text: str):
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', text, re.DOTALL)
    if m:
        return m.group(1), m.group(2)
    return '', text


def measure_words(text: str) -> int:
    fm, body = split_frontmatter(text)
    return extract_frontmatter_content_words(fm) + extract_template_text_words(body)


stubs = []
all_measurements = []

for path in ROOT.rglob('*.astro'):
    rel = path.relative_to(ROOT)
    str_path = str(rel)
    if any(skip in str_path for skip in SKIP_PATTERNS):
        continue

    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue

    words = measure_words(text)
    all_measurements.append((words, str_path))

    if words < 200:
        parts = rel.parts
        if len(parts) == 1:
            if rel.stem.endswith('-county'):
                page_type = 'county_hub'
            elif rel.stem in {'index','book','contact','privacy-policy','terms','about','blog','search','sitemap','404','price-list','credentials','for-business','ai-diagnostic'}:
                page_type = 'meta'
            else:
                page_type = 'city_pillar'
        elif parts[0] == 'brands':
            page_type = 'brand_pillar' if '-' not in rel.stem else 'brand_combo'
        elif parts[0] == 'services':
            page_type = 'service_hub' if len(parts) == 2 else 'service_subservice'
        elif parts[0] == 'commercial':
            page_type = 'commercial_hub' if len(parts) <= 2 else 'commercial_sub'
        elif parts[0] == 'outdoor':
            page_type = 'outdoor'
        elif parts[0] == 'credentials':
            page_type = 'credential'
        elif parts[0] == 'price-list':
            page_type = 'price_list'
        elif parts[0] == 'blog':
            page_type = 'blog'
        elif parts[0] == 'for-business':
            page_type = 'for_business'
        else:
            page_type = 'other'

        title = ''
        for pat in [
            re.compile(r'<title>([^<]+)</title>'),
            re.compile(r'^title:\s*["\']([^"\']+)["\']', re.MULTILINE),
            re.compile(r'const\s+title\s*=\s*["`]([^"`]+)["`]'),
        ]:
            m = pat.search(text)
            if m:
                title = m.group(1)
                break

        url = '/' + str(rel).replace('.astro', '/').replace('\\', '/').replace('index/', '')

        stubs.append({
            'path': str(path),
            'url': url,
            'word_count': words,
            'page_type': page_type,
            'title': title[:120],
        })

stubs.sort(key=lambda s: s['word_count'])

# Sanity check — print a sample of NON-stubs (200+ words) to verify measurement
all_measurements.sort()
print("=== Sanity sample — pages just above 200w (verify measurement is realistic) ===")
above = [m for m in all_measurements if m[0] >= 200][:5]
for w, p in above:
    print(f"  [{w:>4}w] {p}")
print()
top = sorted(all_measurements, reverse=True)[:5]
print("=== Top 5 largest pages ===")
for w, p in top:
    print(f"  [{w:>4}w] {p}")
print()

print(f"=== Total stubs found (<200 words): {len(stubs)} of {len(all_measurements)} pages ===\n")

by_type = Counter(s['page_type'] for s in stubs)
print("=== Distribution by type ===")
for t, n in by_type.most_common():
    print(f"  {t}: {n}")
print()

buckets = Counter()
for s in stubs:
    w = s['word_count']
    if w < 50: buckets['<50 (severe)'] += 1
    elif w < 100: buckets['50-99 (very low)'] += 1
    elif w < 150: buckets['100-149 (low)'] += 1
    else: buckets['150-199 (borderline)'] += 1
print("=== Distribution by word count ===")
for k in ['<50 (severe)', '50-99 (very low)', '100-149 (low)', '150-199 (borderline)']:
    print(f"  {k}: {buckets[k]}")
print()

print("=== Full stub list (sorted by word count asc) ===")
for s in stubs:
    print(f"  [{s['word_count']:>3}w] {s['page_type']:<22} {s['url']}")
    if s['title']:
        print(f"         title: {s['title']}")

pathlib.Path('audit-output').mkdir(exist_ok=True)
pathlib.Path('audit-output/wave-42-stubs.json').write_text(
    json.dumps(stubs, indent=2, ensure_ascii=False), encoding='utf-8'
)
pathlib.Path('audit-output/wave-42-all-measurements.json').write_text(
    json.dumps(
        [{'words': w, 'path': p} for w, p in sorted(all_measurements)],
        indent=2,
    ), encoding='utf-8'
)
print(f"\nSaved: audit-output/wave-42-stubs.json ({len(stubs)} entries)")
print(f"Saved: audit-output/wave-42-all-measurements.json ({len(all_measurements)} entries)")
