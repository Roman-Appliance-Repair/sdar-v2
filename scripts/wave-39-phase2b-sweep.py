"""Wave 39 Phase 2B — apply title rewrites for src/pages/commercial/.

Re-uses classification from wave-39-phase2b-audit.py via the JSON output, then
overwrites the title in <title> / frontmatter / const-title contexts.

Skip rule: existing title <=60 AND != target → preserve (custom).
Escape-quote-aware regex (carried from Phase 2A).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

classify = json.loads(
    (ROOT / "audit-output" / "wave-39-phase2b-classify.json").read_text(encoding="utf-8")
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
no_target: list[tuple[str, str]] = []
no_title: list[str] = []

for entry in classify:
    rel = entry["file"]
    target = entry["target"]
    page_type = entry["type"]
    if target is None:
        no_target.append((rel, page_type))
        continue
    path = ROOT / rel.replace("/", "/")
    text = path.read_text(encoding="utf-8")

    # Find first existing title
    current_raw = None
    for pat, _ in TITLE_CONTEXTS:
        m = pat.search(text)
        if m:
            current_raw = m.group(2).strip()
            break
    if current_raw is None:
        no_title.append(rel)
        continue

    # Decode escapes for length check
    current_rendered = re.sub(r"\\(.)", r"\1", current_raw)

    # Skip rule: preserve custom (<=60 AND != target)
    if len(current_rendered) <= 60 and current_rendered != target:
        preserved.append((rel, current_rendered))
        continue

    # Apply replacement
    original = text
    for pat, _ in TITLE_CONTEXTS:
        def replace(m, _new=target):
            return m.group(1) + _new + m.group(3)
        text = pat.sub(replace, text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append((rel, current_rendered, target))

print(f"=== Wave 39 Phase 2B sweep complete ===")
print(f"Files changed: {len(changed)}")
print(f"Files preserved (custom <=60, != target): {len(preserved)}")
print(f"Files with no target (skipped): {len(no_target)}")
print(f"Files with no title found: {len(no_title)}")
print()
print(f"=== Sample changes (first 30) ===")
for rel, old, new in changed[:30]:
    name = Path(rel).name
    print(f"  {name}")
    print(f"    OLD [{len(old)}]: {old[:75]}")
    print(f"    NEW [{len(new)}]: {new}")
print()
if preserved:
    print(f"=== Preserved custom titles ({len(preserved)}) ===")
    for rel, t in preserved[:20]:
        print(f"  [{len(t):>2}] {Path(rel).name:<45} {t[:60]}")
if no_target:
    print(f"\n=== No target (skipped) ===")
    for rel, ptype in no_target:
        print(f"  [{ptype}] {rel}")
