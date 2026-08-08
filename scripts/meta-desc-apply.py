# -*- coding: utf-8 -*-
"""Validate agent rewrites and apply them to source .astro files.

Usage:
  python scripts/meta-desc-apply.py check   # validate only
  python scripts/meta-desc-apply.py apply   # validate + write files
"""
import io, os, re, sys, json, glob

ROOT = r"C:\Users\Roman\WebstormProjects\sdar-v2"
AUD = os.path.join(ROOT, "audit-output")

fixlist = json.load(io.open(os.path.join(AUD, "meta-desc-fixlist.json"), encoding="utf-8"))
fixlist.sort(key=lambda r: r["src"])  # worklist index order

rewrites = {}
for fp in sorted(glob.glob(os.path.join(AUD, "meta-desc-rewrites-*.json"))):
    for item in json.load(io.open(fp, encoding="utf-8")):
        rewrites[item["i"]] = item["new"]

ABBR = re.compile(r"(?<![\w/.-])(SoCal|WeHo|SGV|IE|BH|SB|LA|OC|SFV|NoHo)(?![\w/.-])")
FORBIDDEN = ["we understand the urgency", "certified technicians", "our team of experts",
    "look no further", "hassle-free", "peace of mind", "second to none", "top-of-the-line",
    "don't hesitate to call", "your satisfaction is our priority",
    "trusted name in the industry", "passionate about delivering"]
PHONE_RE = re.compile(r"\(\d{3}\) \d{3}-\d{4}")

def rendered_len(s):
    return len(s.replace("${phone}", "X" * 14))

errors, warns = [], []
for i, r in enumerate(fixlist):
    new = rewrites.get(i)
    old = r["source_str"]
    tag = "#%d %s" % (i, r["src"])
    if new is None:
        errors.append("MISSING rewrite for " + tag); continue
    L = rendered_len(new)
    if L > 160:
        errors.append("TOO LONG (%d) %s: %s" % (L, tag, new))
    if L < 80:
        warns.append("VERY SHORT (%d) %s: %s" % (L, tag, new))
    m_ab = ABBR.search(new)
    # Samsung error-code list "5C, 5E, or OC" — OC is the over-level code, not Orange County
    if m_ab and not (m_ab.group(1) == "OC" and "5C" in new):
        errors.append("ABBREV %r in %s: %s" % (m_ab.group(1), tag, new))
    low = new.lower()
    for ph in FORBIDDEN:
        if ph in low:
            errors.append("FORBIDDEN %r in %s" % (ph, tag))
    if any(c in new for c in '"`\\'):
        errors.append("BAD CHAR in %s: %s" % (tag, new))
    # price preservation
    for price in ("$89", "$120"):
        if price in old and price not in new:
            errors.append("PRICE %s dropped in %s" % (price, tag))
    # phone preservation
    old_phone = PHONE_RE.search(old) or "${phone}" in old
    if old_phone:
        if not (PHONE_RE.search(new) or "${phone}" in new):
            errors.append("PHONE dropped in %s" % tag)
    if r.get("template") and "${phone}" in old and "${phone}" not in new:
        errors.append("TPL ${phone} missing in %s" % tag)
    if new and new[-1] not in ".!":
        warns.append("NO SENTENCE END in %s: ...%s" % (tag, new[-30:]))

print("entries: %d, rewrites: %d, errors: %d, warns: %d" % (len(fixlist), len(rewrites), len(errors), len(warns)))
for e in errors: print("ERR  " + e)
for w in warns: print("WARN " + w)

if sys.argv[-1] != "apply":
    sys.exit(1 if errors else 0)
if errors:
    print("NOT APPLYING - fix errors first"); sys.exit(1)

changed = []
for i, r in enumerate(fixlist):
    new = rewrites[i]
    fp = os.path.join(ROOT, r["src"].replace("/", os.sep))
    text = io.open(fp, encoding="utf-8").read()
    old = r["source_str"]
    pos = text.find(old)
    if pos < 0:
        print("APPLY-FAIL not found: " + r["src"]); sys.exit(1)
    if text.count(old) != 1:
        print("APPLY-FAIL multi-occurrence: " + r["src"]); sys.exit(1)
    delim = text[pos - 1] if pos > 0 else ""
    rep = new
    if delim == "'":
        rep = new.replace("'", "\\'")
    io.open(fp, "w", encoding="utf-8", newline="").write(text.replace(old, rep))
    changed.append(r["src"])
print("applied %d files" % len(changed))
with io.open(os.path.join(AUD, "meta-desc-changed-files.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(changed))
