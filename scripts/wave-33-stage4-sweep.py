"""Wave 33 Stage 4 — auto-shorten meta descriptions for templated pages.

Categories: brand, commercial, price-list, credentials.
Target: 130-155 chars. Hard floor: 100. Hard ceiling: 160.

Modes:
    dry-run           — print before/after for SAMPLE_FILES (no writes)
    apply             — apply algorithm to all in-scope; emit report.
"""
from pathlib import Path
import json
import re
import sys
import random


ROOT = Path(__file__).parent.parent
VIOLATIONS = ROOT / "scripts" / "wave-33-violations.json"

STAGE4_CATEGORIES = {"brand", "commercial", "price-list", "credentials"}


# ---------------------------------------------------------------------------
# Phrase replacements (applied in order — earlier rules win)
# ---------------------------------------------------------------------------

PHRASE_REPLACEMENTS = [
    # License + cert canonicalization
    (r"BHGS Licensed #A49573", "BHGS #A49573"),
    (r"BHGS license #A49573", "BHGS #A49573"),
    (r"BHGS-licensed #A49573", "BHGS #A49573"),
    (r"BHGS Licensed(?! #)", "BHGS #A49573"),
    (r"EPA 608 Universal certified #1346255700410", "EPA 608"),
    (r"EPA 608 Universal certified", "EPA 608"),
    (r"EPA 608 Universal #1346255700410", "EPA 608"),
    (r"EPA 608 certified #1346255700410", "EPA 608"),
    (r"EPA 608 certified", "EPA 608"),
    (r"EPA-608 Universal certified", "EPA 608"),
    (r"EPA-608 certified", "EPA 608"),
    (r"\bEPA 608 Universal\b", "EPA 608"),
    # Diagnostic phrasing — order matters (most specific first)
    (r"\$89 residential diagnostic waived with repair", "$89 dx waived"),
    (r"\$89 residential diagnostic, waived with repair", "$89 dx waived"),
    (r"\$89 residential diagnostic, applied toward repair", "$89 dx waived"),
    (r"\$89 residential diagnostic, applied toward the repair", "$89 dx waived"),
    (r"\$89 residential diagnostic", "$89 dx"),
    (r"\$89 diagnostic waived with repair", "$89 dx waived"),
    (r"\$89 diagnostic, waived with repair", "$89 dx waived"),
    (r"\$89 diagnostic, applied toward repair", "$89 dx waived"),
    (r"\$89 diagnostic, applied toward the repair", "$89 dx waived"),
    (r"\$89 diagnostic", "$89 dx"),
    (r"\$120 commercial diagnostic, waived with repair", "$120 dx waived"),
    (r"\$120 commercial diagnostic waived with repair", "$120 dx waived"),
    (r"\$120 commercial diagnostic, applied toward repair", "$120 dx waived"),
    (r"\$120 commercial diagnostic", "$120 dx"),
    (r"\$120 diagnostic, waived with repair", "$120 dx waived"),
    (r"\$120 diagnostic waived with repair", "$120 dx waived"),
    (r"\$120 diagnostic", "$120 dx"),
    (r"residential diagnostic, applied toward (?:the )?repair", "$89 dx waived"),
    (r"residential diagnostic waived with repair", "$89 dx waived"),
    (r"commercial diagnostic waived with repair", "$120 dx waived"),
    (r"commercial diagnostic, applied toward (?:the )?repair", "$120 dx waived"),
    # Brand / boilerplate
    (r"Same Day Appliance Repair", "Same-day repair"),
    (r"Same-day appliance repair service", "Same-day repair"),
    (r"appliance repair service", "repair"),
    (r"\bFactory-trained\.?\s*", ""),
    (r"\bFactory-authorized\.?\s*", ""),
    # Hours / availability
    (r"Mon-Sat 8AM-8PM, phone answered 24/7", "Mon-Sat 8-8, 24/7"),
    (r"Mon-Sat 8AM-8PM", "Mon-Sat 8-8"),
    (r"Monday through Saturday", "Mon-Sat"),
    (r"phone answered 24/7", "24/7 phone"),
    # Geography — full and partial-converted forms
    (r"across 5 SoCal counties", "5 counties"),
    (r"across Los Angeles, Orange, Ventura, San Bernardino,? and Riverside( counties)?", "across LA, OC, Ventura, SB, Riverside"),
    (r"across Los Angeles, Orange, Ventura, San Bernardino & Riverside( counties)?", "across LA, OC, Ventura, SB, Riverside"),
    (r"across Los Angeles, Orange, Ventura,? & San Bernardino & Riverside", "across LA, OC, Ventura, SB, Riverside"),
    (r"across LA, Orange, Ventura, San Bernardino & Riverside( counties)?", "across LA, OC, Ventura, SB, Riverside"),
    (r"across LA, Orange, Ventura, San Bernardino,? and Riverside( counties)?", "across LA, OC, Ventura, SB, Riverside"),
    (r"Los Angeles, Orange, Ventura, San Bernardino,? and Riverside counties", "LA, OC, Ventura, SB, Riverside"),
    (r"Los Angeles, Orange, Ventura, San Bernardino & Riverside counties", "LA, OC, Ventura, SB, Riverside"),
    (r"Los Angeles County and Orange County", "LA + OC"),
    (r"Los Angeles County, Orange County", "LA, OC"),
    (r"\bLos Angeles County\b", "LA"),
    (r"\bOrange County\b", "OC"),
    (r"\bSan Bernardino County\b", "SB"),
    (r"\bRiverside County\b", "Riverside"),
    (r"\bVentura County\b", "Ventura"),
    (r"\bSouthern California\b", "SoCal"),
    (r"\bin Los Angeles\b", ""),
    # Same-day
    (r"with same-day service available", "same-day"),
    (r"same-day service available", "same-day"),
    (r"Same-day service available", "Same-day"),
    # Misc
    (r"\bwith transparent pricing\b", ""),
    (r"\btransparent pricing\b", ""),
    (r"\btransparent invoice\b", ""),
    (r"\bwith OEM parts\b", "OEM parts"),
    (r"Call \([0-9]{3}\) [0-9]{3}-[0-9]{4}\.?", ""),
    (r",?\s*\([0-9]{3}\) [0-9]{3}-[0-9]{4}\.?", ""),  # phone numbers anywhere
    # Trailing "Call ${...}" / "Call ." / leftover "Call" after phone or template strip
    (r"\bCall\s+\$\{[^}]+\}\.?", ""),
    (r"\.\s*Call\s*\.?\s*$", "."),
    (r"\bCall\s*\.\s*$", ""),
    (r"\s+Call\s*$", ""),
    (r",\s*Call\.?\s*$", ""),
    # Whitespace cleanup
    (r"  +", " "),
    (r" \. ", ". "),
    (r" ,", ","),
    (r"\.\s*\.", "."),
    (r",\s*,", ","),
]


# ---------------------------------------------------------------------------
# Drop rules (applied in order if length > 155 after phrase replacements)
# ---------------------------------------------------------------------------

DROP_RULES = [
    # 1. drop trailing template-literal phone refs `${...}` and bare phones at any position
    (r"\$\{[^}]+\}\.?", ""),
    (r"\(\d{3}\) \d{3}-\d{4}\.?", ""),
    # 2. drop standalone hours sentences
    (r"\bMon-Sat 8-8,? 24/7( phone)?\.?\s*", ""),
    (r"\bMon-Sat 8-8\.?\s*", ""),
    (r"\b24/7 phone\.?\s*", ""),
    (r"\b24/7 dispatch\.?\s*", ""),
    # 3. drop BBB
    (r"\bBBB A\+ Accredited\b\.?\s*", ""),
    (r"\bBBB Accredited\b\.?\s*", ""),
    (r"\bBBB A\+\b\.?\s*", ""),
    # 4. drop trailing CTAs / generic boilerplate
    (r"\bSchedule today\.?\s*$", ""),
    (r"\bCall now\.?\s*$", ""),
    (r"\bCall us\.?\s*$", ""),
    (r"\bSchedule online\.?\s*$", ""),
    (r"\bGet a quote\.?\s*$", ""),
    (r"\bGet a free quote\.?\s*$", ""),
    # 5. simplify same-day
    (r"\bSame-day service\b", "same-day"),
    # 6. drop 90-day warranty
    (r",?\s*90-day warranty\.?", ""),
    (r"\b90 days SDAR labor and parts warranty\b", ""),
    # 7. drop trailing detail sentences (sentences that don't contain license/dx/price)
    # — this is a structural drop and runs in shorten() loop
    # Final whitespace cleanup
    (r"  +", " "),
    (r"\s+\.", "."),
    (r"\.+", "."),
    (r"^\s+", ""),
    (r"\s+$", ""),
]


CORE_TOKENS = ("BHGS", "EPA", "$89", "$120", "diagnostic", " dx", "warranty")


def drop_trailing_sentence(s: str) -> str:
    """Drop the last full sentence if it does NOT contain any core SEO token."""
    s = s.strip()
    if not s:
        return s
    sentences = re.split(r"(?<=[.!?])\s+", s)
    if len(sentences) < 2:
        return s
    last = sentences[-1]
    if not any(tok in last for tok in CORE_TOKENS):
        return " ".join(sentences[:-1]).strip()
    return s


def drop_non_core_sentences(s: str, target_max: int) -> str:
    """Drop interior sentences (not first or last) that don't contain core tokens.
    Drops longest non-core sentences first; stops as soon as length ≤ target_max."""
    sentences = re.split(r"(?<=[.!?])\s+", s.strip())
    if len(sentences) <= 2:
        return s
    # Identify non-core interior sentences (indices 1..len-2)
    interior_droppable = []
    for i in range(1, len(sentences) - 1):
        sent = sentences[i]
        if not any(tok in sent for tok in CORE_TOKENS):
            interior_droppable.append((i, len(sent)))
    if not interior_droppable:
        return s
    interior_droppable.sort(key=lambda x: -x[1])  # longest first
    keep = list(range(len(sentences)))
    for i, _ in interior_droppable:
        if i in keep:
            keep.remove(i)
            candidate = " ".join(sentences[k] for k in keep)
            if len(candidate) <= target_max:
                return candidate
    # Even after dropping all non-core interior sentences, may still be too long.
    return " ".join(sentences[k] for k in keep)


def drop_parens(s: str) -> str:
    """Drop the longest parenthetical content."""
    matches = list(re.finditer(r"\s*\([^)]+\)", s))
    if not matches:
        return s
    longest = max(matches, key=lambda m: m.end() - m.start())
    return (s[: longest.start()] + s[longest.end():]).strip()


# Final aggressive drop (only if STILL over): remove last comma-separated clause
LAST_RESORT = [
    (r",\s*[^,.]*\s*$", ""),
]


def shorten(desc: str, target_max: int = 155) -> str:
    """Apply phrase replacements, then drop rules, then structural drops
    (trailing detail sentences, parenthetical content) until ≤ target_max."""
    s = desc
    for pat, repl in PHRASE_REPLACEMENTS:
        s = re.sub(pat, repl, s)
    s = _whitespace(s)
    if len(s) <= target_max:
        return _finalize(s)

    for pat, repl in DROP_RULES:
        s = re.sub(pat, repl, s)
        s = _whitespace(s)
        if len(s) <= target_max:
            return _finalize(s)

    # Structural drop: drop interior non-core sentences first
    ns = drop_non_core_sentences(s, target_max)
    if ns != s:
        s = _whitespace(ns)
        if len(s) <= target_max:
            return _finalize(s)

    # Then trailing sentence + parens loop
    for _ in range(6):
        ns = drop_trailing_sentence(s)
        if ns != s:
            s = _whitespace(ns)
            if len(s) <= target_max:
                return _finalize(s)
        ns = drop_parens(s)
        if ns != s:
            s = _whitespace(ns)
            if len(s) <= target_max:
                return _finalize(s)
        if ns == s:
            break

    if len(s) > target_max:
        for pat, repl in LAST_RESORT:
            s = re.sub(pat, repl, s)
            s = _whitespace(s)
            if len(s) <= target_max:
                break
    return _finalize(s)


def _whitespace(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s+([.,])", r"\1", s)
    s = re.sub(r",\s*,", ",", s)
    s = re.sub(r"\.\s*\.", ".", s)
    return s


def _finalize(s: str) -> str:
    s = _whitespace(s)
    if s and s[-1] not in ".!?":
        s += "."
    return s


# ---------------------------------------------------------------------------
# I/O
# ---------------------------------------------------------------------------

def load_violations():
    items = json.loads(VIOLATIONS.read_text(encoding="utf-8"))
    return [v for v in items if v.get("category") in STAGE4_CATEGORIES]


def replace_in_file(file_path: Path, old_unescaped: str, new: str, _qchar: str) -> bool:
    """Find the existing description binding by regex (capturing its raw escaped form)
    and substitute with `new`. Works regardless of which quote style is used or whether
    the original contains escaped quotes."""
    text = file_path.read_text(encoding="utf-8")
    # Try each quote style; capture the raw literal between quotes.
    patterns = [
        # const description = "..." | '...' | `...`
        (r'const\s+description\s*=\s*"((?:[^"\\]|\\.)*?)"', '"'),
        (r"const\s+description\s*=\s*'((?:[^'\\]|\\.)*?)'", "'"),
        (r"const\s+description\s*=\s*`((?:[^`\\]|\\.)*?)`", "`"),
        # description: "..." inside `const meta = { ... }`
        (r"const\s+meta\s*=\s*\{[^}]*?description:\s*\"((?:[^\"\\]|\\.)*?)\"", '"'),
    ]
    for pat, q in patterns:
        m = re.search(pat, text, re.S)
        if not m:
            continue
        raw_old = m.group(1)
        # Compare against the unescaped form we tried to match
        unescaped = (raw_old
                     .replace("\\n", "\n")
                     .replace("\\t", "\t")
                     .replace('\\"', '"')
                     .replace("\\'", "'")
                     .replace("\\\\", "\\"))
        if unescaped != old_unescaped:
            continue
        # Build escaped new value matching the quote style
        if q == '"':
            new_escaped = new.replace("\\", "\\\\").replace('"', '\\"')
        elif q == "'":
            new_escaped = new.replace("\\", "\\\\").replace("'", "\\'")
        else:  # backtick
            new_escaped = new.replace("\\", "\\\\").replace("`", "\\`")
        # Replace the raw_old between quotes with new_escaped
        new_text = text[: m.start(1)] + new_escaped + text[m.end(1):]
        file_path.write_text(new_text, encoding="utf-8")
        return True
    return False


def detect_quote(file_path: Path, desc: str) -> str:
    """Stub kept for compatibility — replace_in_file detects quote internally now."""
    return '"'


def cmd_dry_run():
    violations = load_violations()
    print(f"Stage 4 in-scope violations: {len(violations)}")

    # Pick samples: 1 brand, 1 commercial, 1 price-list, 1 credentials, 1 worst-case
    by_cat = {}
    for v in violations:
        by_cat.setdefault(v["category"], []).append(v)

    samples = []
    rng = random.Random(42)
    for cat in ["brand", "commercial", "price-list", "credentials"]:
        if by_cat.get(cat):
            samples.append(("random " + cat, rng.choice(by_cat[cat])))
    worst = max(violations, key=lambda v: v["length"])
    samples.append(("worst-case " + worst["category"], worst))

    for label, v in samples:
        new_desc = shorten(v["description"])
        print()
        print(f"=== SAMPLE: {label} ===")
        print(f"File: {v['file']}")
        print(f"BEFORE ({v['length']} chars):")
        print(f'  "{v["description"]}"')
        print(f"AFTER  ({len(new_desc)} chars):")
        print(f'  "{new_desc}"')


def cmd_apply():
    violations = load_violations()
    print(f"Stage 4 in-scope: {len(violations)}")

    auto_fixed = []
    flagged_long = []
    flagged_short = []
    no_change = []
    write_failed = []

    for v in violations:
        old = v["description"]
        new = shorten(old)

        if new == old:
            no_change.append(v)
            continue
        if len(new) > 160:
            flagged_long.append((v, new))
            continue
        if len(new) < 100:
            flagged_short.append((v, new))
            continue

        path = ROOT / v["file"]
        qchar = detect_quote(path, old)
        ok = replace_in_file(path, old, new, qchar)
        if not ok:
            write_failed.append((v, new, qchar))
            continue
        auto_fixed.append((v, new))

    print()
    print("=== Stage 4 Sweep Report ===")
    print(f"Pages processed:                    {len(violations)}")
    print(f"Auto-fixed (130-155 ideal):         {len(auto_fixed)}")
    print(f"Flagged manual (still > 160):       {len(flagged_long)}")
    print(f"Flagged manual (< 100, too short):  {len(flagged_short)}")
    print(f"No change (algorithm produced same): {len(no_change)}")
    print(f"Write failed (no match in file):    {len(write_failed)}")

    avg_before = sum(v["length"] for v in violations) / len(violations)
    avg_after = sum(len(n) for _, n in auto_fixed) / len(auto_fixed) if auto_fixed else 0
    print(f"\nAvg BEFORE: {avg_before:.0f} chars")
    print(f"Avg AFTER:  {avg_after:.0f} chars (auto-fixed only)")

    if flagged_long:
        print("\n=== Flagged: still > 160 ===")
        for v, n in flagged_long[:30]:
            print(f"  [{len(n):>3}] {v['file']}")
            print(f"        {n[:140]}")
    if flagged_short:
        print("\n=== Flagged: < 100 ===")
        for v, n in flagged_short[:30]:
            print(f"  [{len(n):>3}] {v['file']}")
            print(f"        {n}")
    if write_failed:
        print("\n=== Write failed ===")
        for v, n, q in write_failed[:30]:
            print(f"  qchar={q}  {v['file']}")

    # Write detailed report json
    report = {
        "auto_fixed": [{"file": v["file"], "before_len": v["length"], "after_len": len(n), "after": n} for v, n in auto_fixed],
        "flagged_long": [{"file": v["file"], "before_len": v["length"], "after_len": len(n), "after": n} for v, n in flagged_long],
        "flagged_short": [{"file": v["file"], "before_len": v["length"], "after_len": len(n), "after": n} for v, n in flagged_short],
        "no_change": [{"file": v["file"], "len": v["length"]} for v in no_change],
        "write_failed": [{"file": v["file"], "qchar": q, "after": n} for v, n, q in write_failed],
    }
    out = ROOT / "scripts" / "wave-33-stage4-report.json"
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDetailed report: {out.relative_to(ROOT)}")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "dry-run"
    if mode == "dry-run":
        cmd_dry_run()
    elif mode == "apply":
        cmd_apply()
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)
