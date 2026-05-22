"""Wave 39 Phase 2C — apply title rewrites for src/pages/services/ and outdoor/.

Reads classify JSON from wave-39-phase2c-audit.py, applies template-driven
rewrites with escape-quote-aware regex.

Skip rule: existing title <=60 AND != target → preserve (custom).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

classify = json.loads(
    (ROOT / "audit-output" / "wave-39-phase2c-classify.json").read_text(encoding="utf-8")
)

TITLE_CONTEXTS = [
    (re.compile(r"(<title>)([^<\n]+)(</title>)"), "html_title"),
    (re.compile(r'(^title:\s*")((?:[^"\\\n]|\\.)+)(")', re.MULTILINE), "frontmatter_dq"),
    (re.compile(r"(^title:\s*')((?:[^'\\\n]|\\.)+)(')", re.MULTILINE), "frontmatter_sq"),
    (re.compile(r'(const\s+title\s*=\s*")((?:[^"\\\n]|\\.)+)(")'), "const_dq"),
    (re.compile(r"(const\s+title\s*=\s*')((?:[^'\\\n]|\\.)+)(')"), "const_sq"),
    (re.compile(r"(const\s+title\s*=\s*`)((?:[^`\\\n]|\\.)+)(`)"), "const_bt"),
]

changed: list[tuple[str, str, str]] = []
preserved: list[tuple[str, str]] = []
no_target_skipped: list[tuple[str, str]] = []
no_title: list[str] = []

for entry in classify:
    rel = entry["file"]
    target = entry["target"]
    page_type = entry["type"]
    if target is None:
        no_target_skipped.append((rel, page_type))
        continue
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")

    current_raw = None
    for pat, _ in TITLE_CONTEXTS:
        m = pat.search(text)
        if m:
            current_raw = m.group(2).strip()
            break
    if current_raw is None:
        no_title.append(rel)
        continue

    current_rendered = re.sub(r"\\(.)", r"\1", current_raw)

    if len(current_rendered) <= 60 and current_rendered != target:
        preserved.append((rel, current_rendered))
        continue

    original = text
    for pat, _ in TITLE_CONTEXTS:
        def replace(m, _new=target):
            return m.group(1) + _new + m.group(3)
        text = pat.sub(replace, text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append((rel, current_rendered, target))

print(f"=== Wave 39 Phase 2C sweep complete ===")
print(f"Files changed: {len(changed)}")
print(f"Files preserved (custom <=60, != target): {len(preserved)}")
print(f"Files with no target (skipped): {len(no_target_skipped)}")
print(f"Files with no title found: {len(no_title)}")
print()
print(f"=== Sample changes (first 20) ===")
for rel, old, new in changed[:20]:
    name = Path(rel).name
    print(f"  {name}")
    print(f"    OLD [{len(old):>2}]: {old[:75]}")
    print(f"    NEW [{len(new):>2}]: {new}")
print()
if preserved:
    print(f"=== Preserved custom titles ({len(preserved)}) ===")
    for rel, t in preserved:
        print(f"  [{len(t):>2}] {Path(rel).name:<45} {t[:60]}")
if no_target_skipped:
    print(f"\n=== Skipped (no target) ===")
    for rel, ptype in no_target_skipped:
        print(f"  [{ptype}] {rel}")
