"""Wave 40 — build unified redirect map (source path → final resolved path).

Sources:
  1. astro.config.mjs — `redirects: { 'src': 'tgt', ... }` block
  2. public/_redirects — Cloudflare format `src tgt 301`

Resolves chains (A → B → C => A → C). Drops self-loops and external targets.
Saves to audit-output/redirect-map.json.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
redirect_map: dict[str, str] = {}

# --- Source 1: astro.config.mjs ---
cfg = ROOT / "astro.config.mjs"
text = cfg.read_text(encoding="utf-8")
# Extract redirects: { ... } block (handle nested braces by greedy match to closing brace)
# Find redirects: { ... },\n  ...
m = re.search(r"redirects:\s*\{(.*?)\n\s*\},?\s*\n", text, re.DOTALL)
if not m:
    # Fallback: greedy
    m = re.search(r"redirects:\s*\{(.*)", text, re.DOTALL)
block = m.group(1) if m else ""

count_astro = 0
for line in re.finditer(
    r"['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]",
    block,
):
    src, tgt = line.group(1), line.group(2)
    if src.startswith("/") and tgt.startswith("/"):
        redirect_map[src] = tgt
        count_astro += 1

# --- Source 2: public/_redirects (Cloudflare) ---
redir_file = ROOT / "public" / "_redirects"
count_cf = 0
for line in redir_file.read_text(encoding="utf-8").splitlines():
    s = line.strip()
    if not s or s.startswith("#"):
        continue
    parts = s.split()
    if len(parts) < 2:
        continue
    src, tgt = parts[0], parts[1]
    if "*" in src or tgt.startswith("http"):
        continue
    redirect_map[src] = tgt
    count_cf += 1


# --- Resolve chains ---
def resolve(path: str, visited: set[str] | None = None) -> str:
    visited = visited or set()
    if path in visited:
        return path
    visited.add(path)
    if path in redirect_map:
        nxt = redirect_map[path]
        if nxt == path:
            return path
        return resolve(nxt, visited)
    return path


resolved = {src: resolve(src) for src in redirect_map}
# Filter only those that actually redirect
final_map = {s: t for s, t in resolved.items() if s != t}

out = ROOT / "audit-output" / "redirect-map.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(
    json.dumps(final_map, indent=2, ensure_ascii=False), encoding="utf-8"
)

print(f"=== Wave 40 redirect map ===")
print(f"Sources: astro.config.mjs ({count_astro}) + public/_redirects ({count_cf})")
print(f"Combined unique source URLs: {len(redirect_map)}")
print(f"After chain resolution (src != final): {len(final_map)}")
print()
chains = sum(
    1 for s in final_map if redirect_map.get(s) != final_map[s]
)
print(f"Multi-hop chains collapsed: {chains}")
print()
print("=== Sample (first 10) ===")
for src, tgt in list(final_map.items())[:10]:
    print(f"  {src}  -->{tgt}")
