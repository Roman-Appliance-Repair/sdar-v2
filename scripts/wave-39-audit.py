"""Wave 39 — title-too-long audit (pre-sweep).

Scans src/pages/ for <title>, frontmatter `title:`, and `const title =`
declarations. Reports:
  - Files with phone in title
  - Files with title > 60 chars
  - Phone-separator distribution
  - Files that will STILL be > 60 after phone strip (Phase 2 candidates)
"""
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src" / "pages"
OUT = ROOT / "audit-output" / "wave39-audit.txt"

TITLE_PATTERNS = [
    re.compile(r"<title>([^<]+)</title>"),
    re.compile(r'^title:\s*["\']([^"\'\n]+)["\']', re.MULTILINE),
    re.compile(r'const\s+title\s*=\s*["`]([^"`\n]+)["`]'),
]

PHONE_PATTERN = re.compile(
    r"\(\d{3}\)\s*\d{3}[-\s]?\d{4}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}"
)


def first_title(text: str) -> str | None:
    for pat in TITLE_PATTERNS:
        m = pat.search(text)
        if m:
            t = m.group(1).strip()
            if len(t) >= 20:
                return t
    return None


def strip_phone_clean(title: str) -> str:
    s = PHONE_PATTERN.sub("", title)
    s = re.sub(r"\s*[|·—]\s*$", "", s).strip()
    s = re.sub(r"\s+", " ", s)
    return s


def main():
    files_with_phone: list[tuple[str, int, str]] = []
    files_over_60: list[tuple[str, int, str]] = []
    sep_counter: Counter[str] = Counter()
    by_category_over: Counter[str] = Counter()
    after_strip_long: list[tuple[str, int, str]] = []

    for path in SRC.rglob("*.astro"):
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        title = first_title(text)
        if not title:
            continue
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        L = len(title)
        has_phone = bool(PHONE_PATTERN.search(title))
        if has_phone:
            files_with_phone.append((rel, L, title))
            phone_pos = PHONE_PATTERN.search(title).start()
            before = title[:phone_pos].rstrip()
            if before.endswith("|"):
                sep_counter["| PHONE"] += 1
            elif before.endswith("—"):
                sep_counter["— PHONE"] += 1
            elif before.endswith("·"):
                sep_counter["· PHONE"] += 1
            elif before.endswith(","):
                sep_counter[", PHONE"] += 1
            else:
                sep_counter["other"] += 1
        if L > 60:
            files_over_60.append((rel, L, title))
            cat = rel.split("/")[2] if rel.count("/") >= 2 else "root"
            by_category_over[cat] += 1
            stripped = strip_phone_clean(title)
            if len(stripped) > 60:
                after_strip_long.append((rel, len(stripped), stripped))

    lines = []
    lines.append("=== Wave 39 audit (pre-sweep) ===")
    lines.append("")
    lines.append(f"Total .astro files scanned: {sum(1 for _ in SRC.rglob('*.astro'))}")
    lines.append(f"Files with phone in <title>: {len(files_with_phone)}")
    lines.append(f"Files with <title> > 60 chars: {len(files_over_60)}")
    lines.append(f"Files STILL > 60 after phone strip (Phase 2 candidates): {len(after_strip_long)}")
    lines.append("")
    lines.append("=== Phone separator distribution ===")
    for sep, n in sep_counter.most_common():
        lines.append(f"  {sep!r}: {n}")
    lines.append("")
    lines.append("=== Title >60 by category ===")
    for cat, n in by_category_over.most_common():
        lines.append(f"  {cat}: {n}")
    lines.append("")
    lines.append("=== Sample 15 titles with phone ===")
    for rel, L, t in files_with_phone[:15]:
        lines.append(f"  [{L}] {rel}")
        lines.append(f"      {t[:120]}")
    lines.append("")
    lines.append("=== Sample 15 still >60 after phone strip (Phase 2 candidates) ===")
    after_strip_long.sort(key=lambda x: -x[1])
    for rel, L, t in after_strip_long[:15]:
        lines.append(f"  [{L}] {rel}")
        lines.append(f"      {t[:120]}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
