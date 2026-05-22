"""Wave 33 — inventory all .astro pages with meta description > 160 chars."""
import re
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
PAGES = ROOT / "src" / "pages"


def find_descriptions(content: str):
    """Yield (pattern_name, description_text) for the SEO meta-description binding only.
    Excludes JSON-LD schema strings and body-content arrays (e.g., recent-repairs `description:`)."""
    # Pattern 1: const description = "..." OR `...` (top-level binding) — reliable
    for q in ['"', "'", "`"]:
        for m in re.finditer(rf'const\s+description\s*=\s*{q}((?:[^{q}\\]|\\.)*?){q}', content):
            yield ("const", m.group(1))
    # Pattern 2: <Layout description="literal" ...> JSX inline string only
    for q in ['"', "'"]:
        for m in re.finditer(rf'(?<![:\w])description\s*=\s*{q}((?:[^{q}\\]|\\.)*?){q}', content):
            yield ("jsx-prop", m.group(1))
    # Pattern 3: ONLY `description:` inside a `const meta = { ... }` block (typical of blogs).
    # Find each `const meta = { ... }` block and extract its description field.
    for m_block in re.finditer(r'const\s+meta\s*=\s*\{([^}]*)\}', content):
        block = m_block.group(1)
        for q in ['"', "'", "`"]:
            mm = re.search(rf'(?<![\'"\w])\bdescription\s*:\s*{q}((?:[^{q}\\]|\\.)*?){q}', block)
            if mm:
                yield ("meta-object", mm.group(1))


def categorize(rel_path: str):
    f = rel_path.replace("\\", "/")
    if "/credentials/" in f:
        return "credentials"
    if "/for-business/" in f:
        return "for-business"
    if "/services/" in f:
        return "service-pillar"
    if "/commercial/" in f:
        return "commercial"
    if "/outdoor/" in f:
        return "outdoor"
    if "/brands/" in f:
        return "brand"
    if "/blog/" in f:
        return "blog"
    if "/price-list/" in f:
        return "price-list"
    if "/[city]/" in f or "/[service]" in f or "/[city]." in f:
        return "parametric-city-service"
    # Top-level city pages: src/pages/{slug}.astro
    if f.startswith("src/pages/") and f.count("/") == 2 and f.endswith(".astro"):
        return "city-pillar-or-root"
    return "other"


def main():
    violations = []
    seen = set()  # (file, description) to dedupe
    for path in PAGES.rglob("*.astro"):
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        for pattern, desc in find_descriptions(content):
            # Unescape simple sequences for accurate length measurement
            unescaped = desc.replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"').replace("\\'", "'").replace("\\\\", "\\")
            length = len(unescaped)
            if length > 160:
                key = (rel, unescaped)
                if key in seen:
                    continue
                seen.add(key)
                violations.append({
                    "file": rel,
                    "pattern": pattern,
                    "length": length,
                    "description": unescaped,
                })

    # Categorize
    cats = {}
    for v in violations:
        c = categorize(v["file"])
        v["category"] = c
        cats.setdefault(c, []).append(v)

    print(f"Total violations (description > 160 chars): {len(violations)}")
    print()
    for cat in sorted(cats):
        items = cats[cat]
        avg_len = sum(v["length"] for v in items) / len(items)
        max_len = max(v["length"] for v in items)
        print(f"  {cat}: {len(items)} files (avg {avg_len:.0f} chars, max {max_len})")

    print("\n=== Top 10 worst (longest descriptions) ===")
    for v in sorted(violations, key=lambda x: -x["length"])[:10]:
        print(f"  {v['length']} chars  {v['file']}")
        print(f'    "{v["description"][:120]}..."')

    out = ROOT / "scripts" / "wave-33-violations.json"
    out.write_text(json.dumps(violations, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved {len(violations)} violations to {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
