#!/usr/bin/env python3
"""Cluster 3 schema upgrade — wrap LocalBusiness в schemaJsons array
with mergeCredentials() helper и add import statement.

Targets 9 outdoor BBQ brand pages:
  - src/pages/outdoor/brands/alfresco|dcs|fire-magic|hestan|
    kalamazoo|lynx|twin-eagles|wolf.astro
  - src/pages/outdoor/smoker-repair/brands/traeger.astro

For each file:
  1. Skip if already imports mergeCredentials (idempotency)
  2. Add import line after last import в frontmatter
  3. Find `const schemaJsons = [` line
  4. After that, find next `{` (start of first array element — the
     LocalBusiness object literal)
  5. Brace-balance к find matching `}`
  6. Verify object contains "@type": "LocalBusiness" (sanity check)
  7. Wrap with mergeCredentials({...})

Idempotent. Safe re-run.
"""

import re
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
DRY_RUN = '--dry-run' in sys.argv

# Files и corresponding import paths (depth varies)
TARGETS = [
    ('src/pages/outdoor/brands/alfresco.astro',     '../../../data/credentials-schema'),
    ('src/pages/outdoor/brands/dcs.astro',          '../../../data/credentials-schema'),
    ('src/pages/outdoor/brands/fire-magic.astro',   '../../../data/credentials-schema'),
    ('src/pages/outdoor/brands/hestan.astro',       '../../../data/credentials-schema'),
    ('src/pages/outdoor/brands/kalamazoo.astro',    '../../../data/credentials-schema'),
    ('src/pages/outdoor/brands/lynx.astro',         '../../../data/credentials-schema'),
    ('src/pages/outdoor/brands/twin-eagles.astro',  '../../../data/credentials-schema'),
    ('src/pages/outdoor/brands/wolf.astro',         '../../../data/credentials-schema'),
    ('src/pages/outdoor/smoker-repair/brands/traeger.astro', '../../../../data/credentials-schema'),
]


def find_brace_match(text, open_idx):
    """Given index of '{', return index of matching '}'. -1 if not found."""
    depth = 0
    in_str = False
    str_char = ''
    escape = False
    i = open_idx
    while i < len(text):
        c = text[i]
        if escape:
            escape = False
        elif in_str:
            if c == '\\':
                escape = True
            elif c == str_char:
                in_str = False
        else:
            if c in ('"', "'", '`'):
                in_str = True
                str_char = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1


def add_import(text, import_path):
    """Insert mergeCredentials import after last existing import в frontmatter."""
    fm_match = re.match(r'^(\s*)---\s*\n', text)
    if not fm_match:
        return text, False
    fm_start = fm_match.end()
    fm_end_match = re.search(r'\n---\s*\n', text[fm_start:])
    if not fm_end_match:
        return text, False
    fm_end = fm_start + fm_end_match.start()
    fm_block = text[fm_start:fm_end]

    # Find last import line
    last_import_end = -1
    for m in re.finditer(r'^import\s+.*?;\s*$', fm_block, re.MULTILINE | re.DOTALL):
        last_import_end = m.end()
    if last_import_end == -1:
        # No imports — insert at frontmatter start
        new_fm = f"import {{ mergeCredentials }} from '{import_path}';\n" + fm_block
    else:
        import_line = f"\nimport {{ mergeCredentials }} from '{import_path}';"
        new_fm = fm_block[:last_import_end] + import_line + fm_block[last_import_end:]
    return text[:fm_start] + new_fm + text[fm_end:], True


def apply_to_file(filepath, import_path):
    """Returns dict с action + change details."""
    text = filepath.read_text(encoding='utf-8')

    # Idempotency check
    if 'credentials-schema' in text:
        return {'action': 'SKIP_already_imported', 'changed': False}

    # Find `const schemaJsons = [`
    m = re.search(r'const\s+schemaJsons\s*=\s*\[', text)
    if not m:
        return {'action': 'SKIP_no_schemaJsons', 'changed': False}

    # Find next `{` after the opening `[`
    after_bracket = m.end()
    obj_start = text.find('{', after_bracket)
    if obj_start == -1:
        return {'action': 'SKIP_no_object_literal', 'changed': False}

    # Brace-balance к find matching `}`
    obj_end = find_brace_match(text, obj_start)
    if obj_end == -1:
        return {'action': 'SKIP_unbalanced_braces', 'changed': False}

    object_content = text[obj_start:obj_end + 1]

    # Sanity check — LocalBusiness in this object
    if '"@type": "LocalBusiness"' not in object_content and '"@type":"LocalBusiness"' not in object_content:
        return {'action': 'SKIP_not_LocalBusiness', 'changed': False, 'first_chars': object_content[:60]}

    # Wrap with mergeCredentials
    new_text = (
        text[:obj_start]
        + 'mergeCredentials('
        + object_content
        + ')'
        + text[obj_end + 1:]
    )

    # Add import
    new_text, import_added = add_import(new_text, import_path)

    if not DRY_RUN:
        filepath.write_text(new_text, encoding='utf-8', newline='\n')

    return {
        'action': 'WRAPPED' + ('+IMPORT' if import_added else ''),
        'changed': True,
    }


def main():
    actions = Counter()
    failed = []

    for rel_path, import_path in TARGETS:
        fp = ROOT / rel_path
        if not fp.exists():
            actions['MISSING_FILE'] += 1
            failed.append((rel_path, 'MISSING_FILE'))
            continue
        result = apply_to_file(fp, import_path)
        actions[result['action']] += 1
        if not result['changed'] and result['action'] not in ('SKIP_already_imported',):
            failed.append((rel_path, result['action'], result.get('first_chars', '')))

    print(f"Files targeted: {len(TARGETS)}")
    for action, n in actions.most_common():
        print(f"  {action:35s}: {n}")
    if failed:
        print()
        print("Failures:")
        for f in failed:
            print(f"  {f}")
    if DRY_RUN:
        print("\n** DRY RUN — no files modified **")


if __name__ == '__main__':
    main()
