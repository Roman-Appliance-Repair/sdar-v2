"""Post-sweep audit — what's still > 60 chars (Phase 2 candidates).

Estimates expanded length for template-literal titles by substituting
typical phone/branch values.
"""
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src" / "pages"
OUT = ROOT / "audit-output" / "wave-39-phase2-candidates.txt"

TITLE_PATTERNS = [
    re.compile(r"<title>([^<]+)</title>"),
    re.compile(r'^title:\s*["\']([^"\'\n]+)["\']', re.MULTILINE),
    re.compile(r'const\s+title\s*=\s*["`]([^"`\n]+)["`]'),
]


def expand_template(t: str) -> str:
    """Roughly expand template literals for length estimation."""
    s = t
    s = re.sub(r"\$\{[\w.]*phone[\w.]*\}", "(424) 325-0520", s)
    s = re.sub(r"\$\{[^}]*\}", "X", s)  # generic fallback
    return s


def first_title(text: str) -> str | None:
    for pat in TITLE_PATTERNS:
        m = pat.search(text)
        if m:
            t = m.group(1).strip()
            if len(t) >= 20:
                return t
    return None


def main():
    by_category: Counter[str] = Counter()
    long_titles: list[tuple[int, str, str]] = []
    total = 0
    in_range = 0

    for path in SRC.rglob("*.astro"):
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        title = first_title(text)
        if not title:
            continue
        total += 1
        expanded = expand_template(title)
        L = len(expanded)
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        if L <= 60:
            in_range += 1
        else:
            long_titles.append((L, rel, expanded))
            cat = rel.split("/")[2] if rel.count("/") >= 2 else "root"
            by_category[cat] += 1

    long_titles.sort(key=lambda x: -x[0])

    lines = []
    lines.append("=== Wave 39 post-Phase-1 audit ===")
    lines.append("")
    lines.append(f"Total .astro pages with titles: {total}")
    lines.append(f"  Titles <= 60 chars (in target): {in_range}")
    lines.append(f"  Titles > 60 (Phase 2 candidates): {len(long_titles)}")
    lines.append("")
    lines.append("=== By category ===")
    for cat, n in by_category.most_common():
        lines.append(f"  {cat}: {n}")
    lines.append("")
    lines.append("=== Top 30 longest (Phase 2 manual rewrite priority) ===")
    for L, rel, t in long_titles[:30]:
        lines.append(f"  [{L}] {rel}")
        lines.append(f"      {t[:140]}")
    lines.append("")
    lines.append("=== All Phase 2 candidates ===")
    for L, rel, t in long_titles:
        lines.append(f"[{L}] {rel}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    # Print first chunk to stdout
    print("\n".join(lines[:60]))


if __name__ == "__main__":
    main()
