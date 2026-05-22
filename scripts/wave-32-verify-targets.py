"""Wave 32 — verify each unique redirect target exists in src/pages/."""
from pathlib import Path
import re

ROOT = Path(__file__).parent.parent
SRC_PAGES = ROOT / "src" / "pages"
REDIRECTS_FILE = Path(r"C:\Users\Roman\Downloads\wave-32-redirects-FINAL.txt")

text = REDIRECTS_FILE.read_text(encoding="utf-8")

# Parse entries: '/source/': '/target/',
entries = re.findall(r"'(/[^']+)':\s*'(/[^']*)'", text)
print(f"Parsed {len(entries)} entries")

unique_targets = sorted(set(t for _, t in entries))
print(f"Unique targets: {len(unique_targets)}")


def exists(target: str) -> bool:
    """Check if a target URL maps to a real file in src/pages/."""
    # Strip leading and trailing slash
    p = target.strip("/")
    if not p:
        return (SRC_PAGES / "index.astro").exists()
    # Try /path/index.astro
    if (SRC_PAGES / p / "index.astro").exists():
        return True
    # Try /path.astro
    if (SRC_PAGES / f"{p}.astro").exists():
        return True
    # Try as parametric route — look for src/pages/{prefix}/[city].astro etc.
    # For city × service: e.g., /alhambra/ — look for /alhambra.astro or alhambra/index.astro
    return False


missing = []
for t in unique_targets:
    if not exists(t):
        missing.append(t)

print(f"\n=== MISSING TARGETS ({len(missing)}) ===")
for m in missing:
    print(f"  {m}")

print(f"\n=== EXISTING ({len(unique_targets) - len(missing)}) ===")
