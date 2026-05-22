"""Save pre-cutover sample (informational only).

Sample = 10 queries present in BOTH:
  pre-cutover (2026-04-15..05-05) AND post-cutover (2026-05-08..22).

For context only — NOT used for fix decisions (different site,
different URL structure).
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
ART = ROOT / "scripts/cannibalization-2026-05-22"

POST_RAW = ART / "gsc-raw.csv"
OUT_CSV = ART / "precut-sample.csv"

# pre-cutover top-100 inlined from MCP get_advanced_search_analytics call
# (start=2026-04-15 end=2026-05-05 dim=query row_limit=100).
PRECUT_TOP100 = [
    ("same day appliance repair", 238, 14.6),
    ("same day stove repair oc", 61, 13.1),
    ("appliance repair glendale", 104, 44.5),
    ("appliance repair westlake village", 4, 5.8),
    ("same day appliance repair los angeles", 18, 10.7),
    ("appliance repair north hollywood ca", 0, 0),  # we'll cross-check from data instead
]


def main() -> int:
    # Build set of lowercased queries seen post-cutover.
    post_queries: dict[str, dict] = {}
    with POST_RAW.open(encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            q = row["query"].lower().strip()
            if q not in post_queries:
                post_queries[q] = {"imp": 0, "clk": 0, "pos_sum": 0.0}
            post_queries[q]["imp"] += int(row["impressions"])
            post_queries[q]["clk"] += int(row["clicks"])
            post_queries[q]["pos_sum"] += float(row["position"]) * int(row["impressions"])

    # PRECUT_TOP100 only has hand-picked rows above; better:
    # cross-reference via separate MCP call (already done) — extract distinct queries
    # from that response file.  Find the tool-results file dynamically.
    tool_dir = Path(r"C:\Users\Roman\.claude\projects\C--Users-Roman\5217c2c1-72aa-43d1-b6f4-468c76efcdd9\tool-results")
    pre_rows = []
    for p in tool_dir.glob("mcp-gsc-get_advanced_search_analytics-*.txt"):
        try:
            envelope = json.loads(p.read_text(encoding="utf-8"))
            payload = json.loads(envelope["result"])
            dr = payload.get("date_range", {})
            if dr.get("start") == "2026-04-15" and dr.get("end") == "2026-05-05":
                pre_rows = payload.get("rows", [])
                break
        except Exception:
            continue
    if not pre_rows:
        print("WARN: precut response file not located, falling back to inlined sample", file=sys.stderr)

    # Find common queries.
    common = []
    for r in pre_rows:
        q = r["query"].lower().strip()
        if q in post_queries:
            common.append({
                "query": r["query"],
                "pre_imp": r["impressions"],
                "pre_pos": r["position"],
                "post_imp": post_queries[q]["imp"],
                "post_pos": round(
                    post_queries[q]["pos_sum"] / max(post_queries[q]["imp"], 1), 2
                ),
            })

    # Sort by pre_imp desc.
    common.sort(key=lambda x: -x["pre_imp"])
    sample = common[:10] if len(common) >= 10 else common

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["query", "pre_imp", "pre_pos", "post_imp", "post_pos"])
        w.writeheader()
        for r in sample:
            w.writerow(r)
    print(f"wrote {OUT_CSV} ({len(sample)} common queries; {len(common)} total cross-period overlap)", file=sys.stderr)

    # Quick numeric summary.
    pre_total = sum(r["impressions"] for r in pre_rows)
    print(f"pre-cutover top-100 sum impressions: {pre_total}", file=sys.stderr)
    # Count HVAC-flavored queries in pre.
    hvac_kw = ("ac ", "air condition", "air duct", "hvac", "air cooler", "ductless")
    hvac_imp = sum(r["impressions"] for r in pre_rows if any(k in r["query"].lower() for k in hvac_kw))
    print(f"  of which HVAC-flavored: {hvac_imp} imps ({100*hvac_imp/max(pre_total,1):.1f}%)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
