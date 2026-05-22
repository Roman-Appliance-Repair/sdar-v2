"""Parse mcp-gsc result file into gsc-raw.csv.

Input:  tool-result file (envelope: {result: "<json-string>"})
Output: scripts/cannibalization-2026-05-22/gsc-raw.csv
        columns: query, page, clicks, impressions, position, ctr
        filter: impressions >= 5
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

IN_FILES = [
    Path(r"C:\Users\Roman\.claude\projects\C--Users-Roman\5217c2c1-72aa-43d1-b6f4-468c76efcdd9\tool-results\mcp-gsc-get_advanced_search_analytics-1779462997924.txt"),
]
OUT_CSV = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2\scripts\cannibalization-2026-05-22\gsc-raw.csv")
IMP_MIN = 5
WINDOW_START = "2026-05-08"
WINDOW_END = "2026-05-22"


def load_rows(p: Path) -> list[dict]:
    envelope = json.loads(p.read_text(encoding="utf-8"))
    payload = json.loads(envelope["result"])
    print(f"  date_range: {payload.get('date_range')}", file=sys.stderr)
    print(f"  dimensions: {payload.get('dimensions')}", file=sys.stderr)
    print(f"  pagination: {payload.get('pagination')}", file=sys.stderr)
    return payload.get("rows", [])


def main() -> int:
    all_rows: list[dict] = []
    for p in IN_FILES:
        print(f"reading {p.name}", file=sys.stderr)
        all_rows.extend(load_rows(p))
    print(f"total raw rows: {len(all_rows)}", file=sys.stderr)

    kept = [r for r in all_rows if r.get("impressions", 0) >= IMP_MIN]
    print(f"after imp>={IMP_MIN}: {len(kept)}", file=sys.stderr)

    total_imp = sum(r["impressions"] for r in kept)
    total_clk = sum(r["clicks"] for r in kept)
    print(f"total impressions (kept): {total_imp}", file=sys.stderr)
    print(f"total clicks (kept): {total_clk}", file=sys.stderr)

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["query", "page", "clicks", "impressions", "position", "ctr"])
        for r in kept:
            keys = r.get("keys") or [r.get("query"), r.get("page")]
            q = keys[0] if len(keys) > 0 else r.get("query", "")
            pg = keys[1] if len(keys) > 1 else r.get("page", "")
            w.writerow([q, pg, r["clicks"], r["impressions"], r["position"], r["ctr"]])
    print(f"wrote {OUT_CSV}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
