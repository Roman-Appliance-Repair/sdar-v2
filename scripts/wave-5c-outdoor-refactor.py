#!/usr/bin/env python3
# scripts/wave-5c-outdoor-refactor.py
# Wave 5c outdoor compliance sweep.
# Mirrors commit 1408acb (brands polish) + 800b5fa (Phase A pillars).
# Em-dash cleanup + EPA 608 / BHGS credential injection on 12 outdoor pages.
# Protects HTML comments only (per scripts/brands-em-dash-cleanup.mjs reference).
# Frontmatter and JSON-LD render as visible content (meta description, schema
# description), so commas in place of em-dashes are correct in those blocks.
#
# Usage:
#   python scripts/wave-5c-outdoor-refactor.py --dry-run
#   python scripts/wave-5c-outdoor-refactor.py --dry-run --files <basename> ...
#   python scripts/wave-5c-outdoor-refactor.py --apply
import argparse
import re
import sys
from pathlib import Path

# === FILE GROUPS ===================================================
# Group A — dual-missing (no BHGS, no EPA): Phase A intro-paragraph
# credential sentence injected at end of section 01 INTRO.
GROUP_A_FALLBACK = [
    "src/pages/outdoor/grill-repair-beverly-hills.astro",
    "src/pages/outdoor/kitchen-repair-malibu.astro",
    "src/pages/outdoor/kitchen-repair-newport-beach.astro",
    "src/pages/outdoor/kitchen-repair-thousand-oaks.astro",
    "src/pages/outdoor/kitchen-maintenance.astro",
]

# Group B — has "EPA-certified refrigerant work" phrasing but no EPA
# number and no BHGS. Expand existing phrase in-place.
GROUP_B_EXPAND = [
    "src/pages/outdoor/wine-cellar-repair-bel-air.astro",
    "src/pages/outdoor/wine-cellar-repair-beverly-hills.astro",
]

# Group C-bhgs — has EPA number but no BHGS. Inject BHGS adjacent to
# the first EPA-number occurrence.
GROUP_C_BHGS_TO_EPA = [
    "src/pages/outdoor/wine-cellar-maintenance.astro",
    "src/pages/outdoor/wine-cellar-repair-malibu.astro",
    "src/pages/outdoor/wine-cellar-repair-newport-beach.astro",
    "src/pages/outdoor/wine-cellar-repair-pacific-palisades.astro",
]

# Group C-epa — has BHGS but no EPA. Inject EPA adjacent to a BHGS sentence.
GROUP_C_EPA_TO_BHGS = [
    "src/pages/outdoor/fireplace-repair.astro",
]

# === REGEX / CONSTANTS =============================================
HTML_COMMENT = re.compile(r"<!--[\s\S]*?-->")

# Banned phrases (defensive scaffolding; current hits = 0 across all 12 files)
BANNED = [
    (re.compile(r"No surprises\.\s*"), "Straightforward pricing. "),
    (re.compile(r"don'?t wait[!.]?", re.IGNORECASE), "Call us"),
    (re.compile(r"hassle.?free", re.IGNORECASE), "straightforward"),
]

# Phase A credential sentence (Phase A pattern, plain <p> per Roman's
# Step 3 decision: <strong> wrap reads as commercial pitch on short-intro
# contexts; plain reads as factual field-observation statement).
PHASE_A_CRED_LINE = (
    '    <p>Licensed in California (BHGS #A49573) and EPA 608 '
    'Universal certified (#1346255700410) for sealed-system refrigeration '
    'work.</p>\n'
)

# Anchor for Group A injection: end of first <section class="section">
# block (section 01 INTRO, the first section after <ServiceHero ... />).
GROUP_A_SECTION_END_RE = re.compile(
    r'(<section class="section">\s*<div class="container[^"]*">[\s\S]*?)(\n  </div>\n</section>)'
)

# Group B in-place phrase expansion. Order matters: most specific first
# (period variant), then comma variant, then bare-phrase variant.
GROUP_B_REPLACEMENTS = [
    ("EPA-certified refrigerant work.",
     "EPA 608 Universal certified (#1346255700410) refrigerant work. BHGS #A49573 licensed."),
    ("EPA-certified refrigerant work,",
     "EPA 608 Universal certified (#1346255700410) refrigerant work, BHGS #A49573 licensed,"),
    ("EPA-certified,",
     "EPA 608 Universal certified (#1346255700410), BHGS #A49573 licensed,"),
]

# Group C-bhgs: append BHGS adjacent to EPA number (first occurrence only).
# Negative lookahead guards idempotency.
GROUP_C_BHGS_INJECT_RE = re.compile(
    r"(EPA 608 Universal certified \(#1346255700410\))(?!\s*[,.]?\s*BHGS)"
)
GROUP_C_BHGS_INJECT_REPL = r"\1, BHGS #A49573 licensed"

# Group C-epa: fireplace-repair has 5 BHGS occurrences, no EPA number.
# Inject EPA adjacent to two natural anchor sentences.
GROUP_C_EPA_REPLACEMENTS = [
    # Body line ~148: "Gas-certified technicians on every gas call. BHGS #A49573."
    ("Gas-certified technicians on every gas call. BHGS #A49573.",
     "Gas-certified technicians on every gas call. BHGS #A49573 and EPA 608 Universal certified #1346255700410."),
    # Schema description line ~88: "Gas-certified technicians, BHGS #A49573."
    ("Gas-certified technicians, BHGS #A49573.",
     "Gas-certified technicians, BHGS #A49573 and EPA 608 Universal certified #1346255700410."),
]


# === SWEEP HELPERS =================================================
def emdash_sweep(text):
    """Replace ' — ' with ', ' and bare '—' with ',' outside HTML comments.
    Returns (new_text, count_replaced)."""
    protected = []

    def stash(m):
        protected.append(m.group(0))
        return f"\x00CMT{len(protected) - 1}\x00"

    sweep_text = HTML_COMMENT.sub(stash, text)
    before = sweep_text.count("—")
    sweep_text = sweep_text.replace(" — ", ", ").replace("—", ",")
    after = sweep_text.count("—")
    for i, original in enumerate(protected):
        sweep_text = sweep_text.replace(f"\x00CMT{i}\x00", original)
    return sweep_text, before - after


def banned_sweep(text):
    count = 0
    for pat, repl in BANNED:
        text, n = pat.subn(repl, text)
        count += n
    return text, count


# === GROUP-SPECIFIC INJECTORS ======================================
def inject_group_a(text):
    """Insert Phase A credential <p><strong>...</strong></p> at end of
    section 01 INTRO. Idempotent: skips if BHGS already present in body."""
    if "A49573" in text:
        return text, 0
    m = GROUP_A_SECTION_END_RE.search(text)
    if not m:
        return text, 0
    inner, closer = m.group(1), m.group(2)
    # Insert credential line before the closing </div></section>.
    new_block = inner + "\n" + PHASE_A_CRED_LINE.rstrip("\n") + closer
    new_text = text[:m.start()] + new_block + text[m.end():]
    return new_text, 1


def inject_group_b(text):
    count = 0
    for old, new in GROUP_B_REPLACEMENTS:
        text, n = re.subn(re.escape(old), new, text)
        count += n
    return text, count


def inject_group_c_bhgs(text):
    """Append BHGS adjacent to first EPA-number occurrence."""
    text, n = GROUP_C_BHGS_INJECT_RE.subn(GROUP_C_BHGS_INJECT_REPL, text, count=1)
    return text, n


def inject_group_c_epa(text):
    count = 0
    for old, new in GROUP_C_EPA_REPLACEMENTS:
        text, n = re.subn(re.escape(old), new, text)
        count += n
    return text, count


GROUP_INJECTOR = {
    "A": inject_group_a,
    "B": inject_group_b,
    "C-bhgs": inject_group_c_bhgs,
    "C-epa": inject_group_c_epa,
}


# === MAIN PIPELINE =================================================
def process_file(path: Path, group: str):
    original = path.read_text(encoding="utf-8")
    text = original
    text, em_count = emdash_sweep(text)
    text, ban_count = banned_sweep(text)
    text, cred_count = GROUP_INJECTOR[group](text)
    return original, text, {
        "em": em_count,
        "ban": ban_count,
        "cred": cred_count,
        "changed": text != original,
        "word_delta": len(text.split()) - len(original.split()),
    }


def diff_first_lines(original, new_text, n=8):
    """Show first n changed lines, paired old/new."""
    o_lines = original.splitlines()
    n_lines = new_text.splitlines()
    out = []
    shown = 0
    max_len = max(len(o_lines), len(n_lines))
    for i in range(max_len):
        ol = o_lines[i] if i < len(o_lines) else ""
        nl = n_lines[i] if i < len(n_lines) else ""
        if ol != nl:
            out.append(f"  L{i+1} OLD: {ol[:140]}")
            out.append(f"  L{i+1} NEW: {nl[:140]}")
            shown += 1
            if shown >= n:
                break
    return "\n".join(out)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true",
                        help="Write changes. Default is dry-run.")
    parser.add_argument("--files", nargs="*",
                        help="Limit to specific basenames or full paths.")
    parser.add_argument("--show-diff", action="store_true",
                        help="Show first changed lines per file.")
    args = parser.parse_args()

    plan = []
    for f in GROUP_A_FALLBACK:
        plan.append((f, "A"))
    for f in GROUP_B_EXPAND:
        plan.append((f, "B"))
    for f in GROUP_C_BHGS_TO_EPA:
        plan.append((f, "C-bhgs"))
    for f in GROUP_C_EPA_TO_BHGS:
        plan.append((f, "C-epa"))

    if args.files:
        plan = [(p, g) for p, g in plan
                if Path(p).name in args.files or p in args.files]

    print(f"Mode: {'APPLY' if args.apply else 'DRY-RUN'}")
    print(f"Files in plan: {len(plan)}")
    print()

    totals = {"em": 0, "ban": 0, "cred": 0, "files_changed": 0}
    for path_str, group in plan:
        path = Path(path_str)
        if not path.exists():
            print(f"  MISSING: {path_str}")
            continue
        original, new_text, stats = process_file(path, group)
        print(f"=== {path.name} (group {group}) ===")
        print(f"  em-dashes replaced: {stats['em']:>3}")
        print(f"  banned phrases:     {stats['ban']:>3}")
        print(f"  cred injections:    {stats['cred']:>3}")
        print(f"  word delta:         {stats['word_delta']:+d}")
        print(f"  changed:            {stats['changed']}")
        if args.show_diff and stats["changed"]:
            print(diff_first_lines(original, new_text, n=4))
        if args.apply and stats["changed"]:
            path.write_text(new_text, encoding="utf-8")
            print(f"  WRITTEN.")
        if stats["changed"]:
            totals["files_changed"] += 1
        totals["em"] += stats["em"]
        totals["ban"] += stats["ban"]
        totals["cred"] += stats["cred"]
        print()

    print("=== TOTALS ===")
    print(f"  files changed:      {totals['files_changed']}")
    print(f"  em-dashes replaced: {totals['em']}")
    print(f"  banned phrases:     {totals['ban']}")
    print(f"  cred injections:    {totals['cred']}")


if __name__ == "__main__":
    main()
