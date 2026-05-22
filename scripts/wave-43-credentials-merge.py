#!/usr/bin/env python3
"""Wave 43 — Apply mergeCredentials() wrap to LSA-critical single-object schemas.

Targets files matching pattern `const localBusinessSchema = {` (city pillars +
contact + book). Other schema patterns (schemaJsons array, raw inline JSON)
are deferred to Phase 2b-2.

For each file:
  1. Skip if `credentials-schema` already imported (idempotency).
  2. Add import line after the last existing import in frontmatter.
  3. Find `const localBusinessSchema = {` line.
  4. Brace-balance to find matching `};` end.
  5. Wrap content: `const localBusinessSchema = mergeCredentials({...});`

Output:
  audit-results/wave-43-credentials-merge-log.txt
"""

import re
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
DRY_RUN = '--dry-run' in sys.argv

# Build target list
def collect_targets():
    targets = []
    # 1. All top-level .astro in src/pages/ except utility/legacy
    skip_top = {
        'index.astro', 'ai-diagnostic.astro', 'about.astro',
        # Note: contact.astro + book.astro INCLUDED — they have single-object pattern
    }
    for p in (ROOT / 'src' / 'pages').glob('*.astro'):
        if p.name in skip_top:
            continue
        if p.name.endswith('.legacy'):
            continue
        targets.append(p)
    return sorted(targets)

IMPORT_LINE = "import { mergeCredentials } from '../data/credentials-schema';\n"
WRAP_PREFIX = "const localBusinessSchema = mergeCredentials({"

# Pattern: find the const declaration line
CONST_RE = re.compile(r'^(const\s+localBusinessSchema\s*=\s*)\{', re.MULTILINE)

def find_brace_match(text, open_idx):
    """Given index of '{', return index of matching '}'. Returns -1 if not found."""
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

def add_import(text):
    """Insert IMPORT_LINE after the last existing `import` statement in the
    frontmatter (between the opening `---` and closing `---` lines)."""
    # Find frontmatter
    fm_match = re.match(r'^(\s*)---\s*\n', text)
    if not fm_match:
        return text, False
    fm_start = fm_match.end()
    fm_end_match = re.search(r'\n---\s*\n', text[fm_start:])
    if not fm_end_match:
        return text, False
    fm_end = fm_start + fm_end_match.start()
    fm_block = text[fm_start:fm_end]

    # Find last `import ` line in frontmatter
    last_import_line_end = -1
    for m in re.finditer(r'^import\s+.*?;\s*$', fm_block, re.MULTILINE | re.DOTALL):
        last_import_line_end = m.end()
    if last_import_line_end == -1:
        # No imports yet — insert at start of frontmatter content
        new_fm = IMPORT_LINE + fm_block
    else:
        new_fm = fm_block[:last_import_line_end] + '\n' + IMPORT_LINE.rstrip() + fm_block[last_import_line_end:]
    return text[:fm_start] + new_fm + text[fm_end:], True

def apply_to_file(path):
    """Returns dict with: action, before/after sample (for dry-run), changed bool."""
    text = path.read_text(encoding='utf-8')

    # Idempotency check
    if 'credentials-schema' in text:
        return {'action': 'SKIP_already_has_import', 'changed': False}

    # Find const declaration
    m = CONST_RE.search(text)
    if not m:
        return {'action': 'SKIP_no_const_pattern', 'changed': False}

    open_brace_idx = m.end() - 1  # position of '{' (was matched as last char)
    close_brace_idx = find_brace_match(text, open_brace_idx)
    if close_brace_idx == -1:
        return {'action': 'SKIP_unbalanced_braces', 'changed': False}

    # Verify the next char after '}' is ';' (typical pattern: `};`)
    next_chars = text[close_brace_idx + 1: close_brace_idx + 3]
    if not next_chars.startswith(';'):
        return {'action': 'SKIP_no_semicolon_after_brace', 'changed': False, 'next': repr(next_chars)}

    # Build new text:
    #   const localBusinessSchema = mergeCredentials({   ...content...   });
    object_content = text[open_brace_idx:close_brace_idx + 1]  # includes braces
    new_decl = m.group(1) + 'mergeCredentials(' + object_content + ')'
    new_text = text[:m.start()] + new_decl + text[close_brace_idx + 1:]

    # Add import
    new_text, import_added = add_import(new_text)

    # Sample for dry-run reporting
    before_snippet = text[m.start():close_brace_idx + 2].splitlines()[0:3]
    after_snippet = new_text[m.start():m.start() + 200].splitlines()[0:3]

    if not DRY_RUN:
        path.write_text(new_text, encoding='utf-8', newline='\n')

    return {
        'action': 'WRAPPED' + ('+IMPORT' if import_added else ''),
        'changed': True,
        'before_first_line': before_snippet[0] if before_snippet else '',
        'after_first_line': after_snippet[0] if after_snippet else ''
    }

def main():
    targets = collect_targets()
    actions = Counter()
    samples = []
    failed_files = []

    for t in targets:
        result = apply_to_file(t)
        actions[result['action']] += 1
        if result['changed']:
            rel = t.relative_to(ROOT).as_posix()
            samples.append((rel, result))
        elif result['action'] not in ('SKIP_already_has_import',):
            failed_files.append((t.relative_to(ROOT).as_posix(), result['action']))

    # Output log
    log_path = ROOT / 'audit-results' / 'wave-43-credentials-merge-log.txt'
    log_path.parent.mkdir(exist_ok=True)
    lines = []
    lines.append(f"# Wave 43 Credentials Merge Log — {'DRY RUN' if DRY_RUN else 'APPLIED'}")
    lines.append(f"")
    lines.append(f"Targets scanned: {len(targets)}")
    for action, n in actions.most_common():
        lines.append(f"  {action:35s}: {n}")
    lines.append(f"")
    lines.append(f"## Sample wraps (first 5)")
    for rel, r in samples[:5]:
        lines.append(f"  {rel}")
        lines.append(f"    BEFORE: {r['before_first_line'][:120]}")
        lines.append(f"    AFTER:  {r['after_first_line'][:120]}")
    if failed_files:
        lines.append(f"")
        lines.append(f"## Files NOT modified (need investigation)")
        for fp, action in failed_files[:30]:
            lines.append(f"  {action:35s} {fp}")

    log_path.write_text('\n'.join(lines), encoding='utf-8')

    # Stdout summary (ASCII safe)
    print(f"Targets scanned: {len(targets)}")
    for action, n in actions.most_common():
        print(f"  {action:35s}: {n}")
    print(f"\nLog: {log_path.relative_to(ROOT).as_posix()}")
    if DRY_RUN:
        print("\n** DRY RUN -- no files modified. Re-run without --dry-run to apply. **")

if __name__ == '__main__':
    main()
