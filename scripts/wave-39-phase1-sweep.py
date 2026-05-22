"""Wave 39 Phase 1 — strip phone template literals + brand tail from <title> only.

Two patterns, applied within title contexts only (NOT body/hero/schema/meta):
  A. Phone template literals: ${branch.phone}, ${phone} (with preceding separator)
  B. Brand tail: " | Same Day Appliance Repair" / " — ..." / " · ..." at end

Cleans up orphan trailing separators after strip.
Does NOT collapse whitespace runs (preserves indentation).
"""
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src" / "pages"

# Title contexts (non-greedy capture of inner content).
# Each pattern: (regex, label) — capturing groups: 1=prefix, 2=title, 3=suffix
TITLE_CONTEXTS = [
    (re.compile(r"(<title>)([^<\n]+)(</title>)"), "html_title"),
    (re.compile(r'(^title:\s*["\'])([^"\'\n]+)(["\'])', re.MULTILINE), "frontmatter"),
    # const title = "..." | '...' | `...` — accept all three quote styles
    (re.compile(r"(const\s+title\s*=\s*\")([^\"\n]+)(\")"), "const_title_dq"),
    (re.compile(r"(const\s+title\s*=\s*')([^'\n]+)(')"), "const_title_sq"),
    (re.compile(r"(const\s+title\s*=\s*`)([^`\n]+)(`)"), "const_title_bt"),
]

# Pattern A — phone template literals at end of title (with leading separator).
# Match: " | ${branch.phone}" / " · ${phone}" / " — ${displayPhone}" + similar.
# Case-insensitive on the "phone" substring to catch displayPhone, branchPhone, etc.
PHONE_PATTERNS = [
    re.compile(r"\s*[|·—]\s*\$\{[\w.]*phone[\w.]*\}\s*$", re.IGNORECASE),
]

# Pattern B — brand-tail at end of title (with leading separator).
BRAND_TAIL_PATTERNS = [
    re.compile(r"\s*[|·—]\s*Same Day Appliance Repair\s*$"),
]


def sweep_title(title: str, stats: Counter, ctx_name: str, ops: list) -> str:
    s = title
    for p in PHONE_PATTERNS:
        new = p.sub("", s)
        if new != s:
            stats[f"{ctx_name}:phone_stripped"] += 1
            ops.append("phone")
            s = new
    for p in BRAND_TAIL_PATTERNS:
        new = p.sub("", s)
        if new != s:
            stats[f"{ctx_name}:brand_tail_stripped"] += 1
            ops.append("brand")
            s = new
    # Cleanup any orphan trailing separator + collapse double-spaces ONLY (not indents).
    s = re.sub(r"\s*[|·—]\s*$", "", s).rstrip()
    s = re.sub(r"  +", " ", s)
    return s


def main():
    stats: Counter = Counter()
    changed: list[tuple[str, list[str]]] = []

    for path in SRC.rglob("*.astro"):
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        original = text
        ops: list[str] = []
        for pattern_re, ctx_name in TITLE_CONTEXTS:
            def replace(match, ctx=ctx_name):
                prefix, title, suffix = match.group(1), match.group(2), match.group(3)
                new_title = sweep_title(title, stats, ctx, ops)
                return prefix + new_title + suffix
            text = pattern_re.sub(replace, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append((str(path.relative_to(ROOT)), ops))

    print("=== Phase 1 sweep complete ===")
    print(f"Files changed: {len(changed)}")
    print()
    print("Strip stats:")
    for k, v in sorted(stats.items()):
        print(f"  {k}: {v}")
    print()
    print(f"=== Sample first 30 ===")
    for rel, ops in changed[:30]:
        print(f"  {','.join(ops):<15} {rel}")


if __name__ == "__main__":
    main()
