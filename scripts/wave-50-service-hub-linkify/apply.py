"""Wave 50 - apply <a> wrap to <strong>{Brand}</strong> in service hubs."""
import json
import os
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
CAND = ROOT / "audit-output" / "wave-50-candidates.json"

with open(CAND, encoding="utf-8") as f:
    data = json.load(f)

stats = {"processed": 0, "skipped": 0, "errors": []}

for cand in data["candidates"]:
    file_path = ROOT / "src" / "pages" / "services" / cand["file"]
    if not file_path.exists():
        stats["errors"].append({"file": cand["file"], "error": "not found"})
        continue

    content = file_path.read_text(encoding="utf-8")

    matches = sorted(cand["matches"], key=lambda m: -m["match_start"])

    for m in matches:
        inner = m["inner_text"]
        slug = m["slug"]
        brand = m["brand"]

        if inner == brand:
            new_inner = f'<a href="/brands/{slug}/">{brand}</a>'
        elif inner.startswith(brand + ":"):
            suffix = inner[len(brand):]
            new_inner = f'<a href="/brands/{slug}/">{brand}</a>{suffix}'
        elif inner.startswith(brand + " ("):
            suffix = inner[len(brand):]
            new_inner = f'<a href="/brands/{slug}/">{brand}</a>{suffix}'
        elif inner.rstrip(":").strip() == brand:
            new_inner = f'<a href="/brands/{slug}/">{inner}</a>'
        else:
            stats["skipped"] += 1
            continue

        old = f"<strong>{inner}</strong>"
        new = f"<strong>{new_inner}</strong>"

        idx = content.find(old)
        if idx == -1:
            stats["skipped"] += 1
            continue
        content = content[:idx] + new + content[idx + len(old):]

    tmp = file_path.with_suffix(".astro.tmp")
    tmp.write_text(content, encoding="utf-8")
    os.replace(tmp, file_path)
    stats["processed"] += 1

print(f"Files processed: {stats['processed']}")
print(f"Skipped: {stats['skipped']}")
print(f"Errors: {len(stats['errors'])}")
for e in stats["errors"]:
    print(f"  {e}")
