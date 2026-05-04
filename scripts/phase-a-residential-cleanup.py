#!/usr/bin/env python3
"""Phase A residential pillars compliance sweep.

Mirror of commit 1408acb (brands polish). Character-level fixes only — no
content rewrites, net zero word count delta target.

Scope: 26 residential pillars in src/pages/services/*.astro
Excludes: index.astro

Fixes applied:
1. Em-dash cleanup: " — " → ", " (preserving HTML comments, JSON-LD, style blocks)
2. Banned-phrase removal: "Straightforward pricing. No surprises." → "Straightforward pricing."
                          "Price was fair, no surprises." → "Price was fair."
3. EPA injection: where missing, append "EPA 608 Universal certified #1346255700410"
   to first existing BHGS Licensed #A49573 sentence
4. BHGS injection (3 specific files):
   - wine-cellar-repair, wine-cellar-cooling-repair: add "BHGS #A49573" adjacent to EPA
   - outdoor-refrigerator-repair: add full credential sentence in intro

Run: python scripts/phase-a-residential-cleanup.py
Idempotent: re-running is safe (skips files already containing target tokens).
"""
import re
import sys
from pathlib import Path

ROOT = Path('src/pages/services')
EXCLUDE = {'index.astro', 'range-repair.astro'}  # range-repair handled by T2 (separate prompt)

# Protected regions: do not touch em-dashes inside these
PROTECTED_PATTERNS = [
    re.compile(r'<!--[\s\S]*?-->'),
    re.compile(r'<script[^>]*application/ld\+json[^>]*>[\s\S]*?</script>'),
    re.compile(r'<style[\s\S]*?</style>'),
]

EPA_NUMBER = '#1346255700410'
EPA_FULL = 'EPA 608 Universal certified #1346255700410'
BHGS_FULL = 'BHGS #A49573'

OUTDOOR_FRIDGE_CREDENTIAL_SENTENCE = (
    'Licensed in California (BHGS #A49573) and EPA 608 Universal certified '
    '(#1346255700410) for sealed-system refrigeration work.'
)


def stash_protected(content):
    """Replace protected regions with placeholders, return (body, placeholders)."""
    placeholders = []

    def _replace(match):
        placeholders.append(match.group(0))
        return f'__PROT_{len(placeholders) - 1}__'

    body = content
    for pattern in PROTECTED_PATTERNS:
        body = pattern.sub(_replace, body)
    return body, placeholders


def restore_protected(body, placeholders):
    """Restore stashed protected regions back into body."""
    for i, content in enumerate(placeholders):
        body = body.replace(f'__PROT_{i}__', content)
    return body


def cleanup_em_dashes(body):
    """Remove em-dashes from body (already-stashed protected regions are safe)."""
    body = re.sub(r' — ', ', ', body)
    body = re.sub(r'(\w)—(\w)', r'\1, \2', body)
    body = body.replace('—', ',')
    return body


def remove_banned_phrases(body):
    """Drop specific banned phrases per Roman's approved replacements."""
    replacements = [
        ('Straightforward pricing. No surprises.', 'Straightforward pricing.'),
        ('Price was fair, no surprises.', 'Price was fair.'),
    ]
    for old, new in replacements:
        body = body.replace(old, new)
    return body


def inject_epa(body):
    """If body has BHGS #A49573 but no EPA #1346, inject EPA into first BHGS sentence."""
    if EPA_NUMBER in body:
        return body, False
    if 'A49573' not in body:
        return body, False  # No BHGS to inject into

    # Try patterns from most-specific to least-specific
    patterns = [
        # "BHGS Licensed #A49573." → "BHGS Licensed #A49573. EPA 608 Universal certified #1346255700410."
        (r'(BHGS Licensed #A49573)\.', r'\1. EPA 608 Universal certified #1346255700410.'),
        # "BHGS Licensed #A49573," → ", EPA 608 ...,"
        (r'(BHGS Licensed #A49573),', r'\1, EPA 608 Universal certified #1346255700410,'),
        # "BHGS Licensed #A49573 " (trailing space) → ", EPA 608 ..., "
        (r'(BHGS Licensed #A49573) ', r'\1, EPA 608 Universal certified #1346255700410, '),
        # "BHGS Licensed #A49573<" (HTML close) → "...#A49573, EPA 608 ...<"
        (r'(BHGS Licensed #A49573)<', r'\1, EPA 608 Universal certified #1346255700410<'),
    ]
    for pattern, replacement in patterns:
        new_body, count = re.subn(pattern, replacement, body, count=1)
        if count > 0:
            return new_body, True
    return body, False


def inject_bhgs_wine_cellar(body):
    """For wine-cellar-repair: inject BHGS adjacent to existing EPA mention."""
    if 'A49573' in body:
        return body, False

    # Inject BHGS before the FIRST mention of "EPA 608 Universal certification (#1346255700410)"
    patterns = [
        # "EPA 608 Universal certification (#1346255700410)" → "BHGS #A49573, EPA 608 ..."
        (r'EPA 608 Universal certification \(#1346255700410\)',
         r'BHGS #A49573, EPA 608 Universal certification (#1346255700410)'),
        # Fallback: "EPA-certified" → "BHGS #A49573 + EPA-certified"
        (r'EPA-certified refrigerant handling',
         r'BHGS #A49573 + EPA-certified refrigerant handling'),
    ]
    for pattern, replacement in patterns:
        new_body, count = re.subn(pattern, replacement, body, count=1)
        if count > 0:
            return new_body, True
    return body, False


def inject_bhgs_wine_cooling(body):
    """For wine-cellar-cooling-repair: inject BHGS adjacent to existing EPA mention."""
    if 'A49573' in body:
        return body, False

    # First mention is in const description (line ~21):
    # "Refrigerant work (EPA 608 Universal certified (#1346255700410))"
    patterns = [
        # In const description: insert BHGS into the trust block
        (r'EPA 608 Universal certified \(#1346255700410\)\)',
         r'BHGS #A49573, EPA 608 Universal certified (#1346255700410))'),
        (r"EPA 608 certified",
         r"BHGS #A49573, EPA 608 certified"),
    ]
    for pattern, replacement in patterns:
        new_body, count = re.subn(pattern, replacement, body, count=1)
        if count > 0:
            return new_body, True
    return body, False


def inject_credential_outdoor_fridge(body):
    """For outdoor-refrigerator-repair: insert NEW credential sentence in intro section.

    Insertion point: end of intro section, before </div></section>.
    Specifically: append a new <p> with the credential sentence right before
    the closing </div> of intro section's container.narrow.
    """
    if 'A49573' in body and EPA_NUMBER in body:
        return body, False

    # Find the intro section's closing pattern.
    # Intro section ends with: "...tells us everything in 30 seconds.</p>\n  </div>\n</section>"
    target = '</p>\n  </div>\n</section>\n\n<!-- 02 FOUR FAILURES -->'
    new_paragraph = (
        f'</p>\n\n    <p><strong>{OUTDOOR_FRIDGE_CREDENTIAL_SENTENCE}</strong></p>\n'
        '  </div>\n</section>\n\n<!-- 02 FOUR FAILURES -->'
    )
    if target in body:
        body = body.replace(target, new_paragraph, 1)
        return body, True
    return body, False


def process_file(path):
    """Process one file. Returns dict with stats."""
    original = path.read_text(encoding='utf-8')
    slug = path.stem

    body, placeholders = stash_protected(original)
    em_before = body.count('—')

    # Em-dash cleanup
    body = cleanup_em_dashes(body)
    em_after = body.count('—')

    # Banned phrases
    body_pre_banned = body
    body = remove_banned_phrases(body)
    banned_changed = body != body_pre_banned

    # EPA injection (general, except wine-cellar-cooling which already has EPA)
    epa_added = False
    if slug == 'outdoor-refrigerator-repair':
        body, epa_added = inject_credential_outdoor_fridge(body)
    elif slug == 'wine-cellar-repair':
        body, epa_added = inject_bhgs_wine_cellar(body)
    elif slug == 'wine-cellar-cooling-repair':
        body, epa_added = inject_bhgs_wine_cooling(body)
    else:
        body, epa_added = inject_epa(body)

    body = restore_protected(body, placeholders)

    changed = body != original
    if changed:
        path.write_text(body, encoding='utf-8')

    return {
        'slug': slug,
        'changed': changed,
        'em_before': em_before,
        'em_after': em_after,
        'em_delta': em_before - em_after,
        'epa_added': epa_added,
        'banned_changed': banned_changed,
    }


def main():
    if not ROOT.is_dir():
        print(f'ERROR: {ROOT} not found. Run from repo root.', file=sys.stderr)
        return 1

    files = sorted(f for f in ROOT.glob('*.astro') if f.name not in EXCLUDE)
    if len(files) == 0:
        print('No files to process.')
        return 0

    print(f'Processing {len(files)} pillars (excluding {", ".join(EXCLUDE)})...\n')

    results = []
    for f in files:
        result = process_file(f)
        results.append(result)
        flag = 'CHANGED' if result['changed'] else 'unchanged'
        print(
            f"  {flag}  {result['slug']:<35} "
            f"em: {result['em_before']:>3} -> {result['em_after']:>3}  "
            f"EPA: {'+' if result['epa_added'] else ' '}  "
            f"banned: {'+' if result['banned_changed'] else ' '}"
        )

    # Summary
    changed_count = sum(1 for r in results if r['changed'])
    em_total_before = sum(r['em_before'] for r in results)
    em_total_after = sum(r['em_after'] for r in results)
    epa_count = sum(1 for r in results if r['epa_added'])
    banned_count = sum(1 for r in results if r['banned_changed'])

    print(f'\nSummary:')
    print(f'  Files changed: {changed_count} of {len(files)}')
    print(f'  Em-dashes total: {em_total_before} -> {em_total_after} (-{em_total_before - em_total_after})')
    print(f'  EPA injections: {epa_count}')
    print(f'  Banned-phrase replacements: {banned_count}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
