"""Validate length of all 56 manual rewrite drafts."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module
mod = import_module("wave-33-stage4-manual")

ok = 0
oor = []
for path, desc in mod.REWRITES.items():
    n = len(desc)
    flag = "OK" if 130 <= n <= 155 else "OOR"
    if flag == "OK":
        ok += 1
    else:
        oor.append((path, n, desc))
    print(f"  [{n:>3} {flag}] {path}")

print(f"\n{ok}/{len(mod.REWRITES)} in 130-155 range")
if oor:
    print("Out of range:")
    for path, n, d in oor:
        print(f"  [{n}] {path}")
        print(f"    {d}")
