"""Extract current descriptions for top 30 priority pages."""
import re
import os
import json

priority = [
    "src/pages/index.astro",
    "src/pages/services/bbq-grill-repair.astro",
    "src/pages/commercial/dishwasher-repair.astro",
    "src/pages/commercial/washer-repair.astro",
    "src/pages/commercial/refrigeration/index.astro",
    "src/pages/services/range-hood-repair.astro",
    "src/pages/services/wine-cooler-repair.astro",
    "src/pages/services/index.astro",
    "src/pages/commercial/fryer-repair.astro",
    "src/pages/services/fireplace-repair.astro",
    "src/pages/services/stove-repair.astro",
    "src/pages/commercial/ice-machines/index.astro",
    "src/pages/services/microwave-repair.astro",
    "src/pages/services/refrigerator-repair.astro",
    "src/pages/services/dryer-repair.astro",
    "src/pages/services/washer-repair.astro",
    "src/pages/services/dishwasher-repair.astro",
    "src/pages/services/oven-repair.astro",
    "src/pages/west-hollywood.astro",
    "src/pages/los-angeles.astro",
    "src/pages/pasadena.astro",
    "src/pages/glendale.astro",
    "src/pages/burbank.astro",
    "src/pages/santa-monica.astro",
    "src/pages/hollywood.astro",
    "src/pages/beverly-hills.astro",
    "src/pages/thousand-oaks.astro",
    "src/pages/anaheim.astro",
    "src/pages/price-list/index.astro",
    "src/pages/blog/index.astro",
]

out = []
for i, fp in enumerate(priority, 1):
    if not os.path.exists(fp):
        out.append({"i": i, "file": fp, "exists": False})
        continue
    text = open(fp, "r", encoding="utf-8").read()
    desc = None
    pattern = "NOT_FOUND"
    # Try const description = "..."
    for q, pname in [('"', "const-double"), ("'", "const-single"), ("`", "const-backtick")]:
        m = re.search(r"const\s+description\s*=\s*" + re.escape(q) + r"((?:[^" + re.escape(q) + r"\\]|\\.)*?)" + re.escape(q), text, re.S)
        if m:
            desc = m.group(1)
            pattern = pname
            break
    # Fall back to const meta = { description: "..." }
    if desc is None:
        block = re.search(r"const\s+meta\s*=\s*\{[^}]*?description:\s*\"((?:[^\"\\]|\\.)*?)\"", text, re.S)
        if block:
            desc = block.group(1)
            pattern = "meta-object"
    out.append({"i": i, "file": fp, "exists": True, "desc": desc, "len": len(desc) if desc else 0, "pattern": pattern})

for r in out:
    if not r.get("exists"):
        print(f"  {r['i']:2d}. [MISSING]  {r['file']}")
        continue
    if r["desc"] is None:
        print(f"  {r['i']:2d}. [NO_DESC]  {r['file']}")
        continue
    flag = " "
    if r["len"] > 160:
        flag = "!"
    elif r["len"] > 155:
        flag = "+"
    elif r["len"] < 130:
        flag = "-"
    print(f"  {r['i']:2d}. [{r['len']:>3}{flag}] {r['file']} ({r['pattern']})")
    print(f"        {r['desc']}")
    print()

open("scripts/wave-33-priority30.json", "w", encoding="utf-8").write(
    json.dumps(out, indent=2, ensure_ascii=False)
)
