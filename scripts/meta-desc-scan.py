# -*- coding: utf-8 -*-
"""Scan dist for meta description lengths + parse audit file sets."""
import io, os, re, sys, html, json

ROOT = r"C:\Users\Roman\WebstormProjects\sdar-v2"
DIST = os.path.join(ROOT, "dist")
AUDIT = os.path.join(ROOT, "audit-output", "abbrev-overflow-final.txt")

# --- parse audit file ---
sweep_files, pre_desc_files, pre_title_files = [], [], []
section = None
with io.open(AUDIT, encoding="utf-8") as f:
    for line in f:
        line = line.rstrip("\n")
        if line.startswith("SWEEP-CAUSED"):
            section = "sweep"; continue
        if line.startswith("PRE-EXISTING"):
            section = "pre"; continue
        m = re.match(r"^(desc|title) (\d+) \| (.+)$", line)
        if not m:
            continue
        kind, ln, path = m.group(1), int(m.group(2)), m.group(3)
        if section == "sweep":
            sweep_files.append(path)
        elif kind == "desc":
            pre_desc_files.append(path)
        else:
            pre_title_files.append((path, ln))

sweep_set, pre_set = set(sweep_files), set(pre_desc_files)
overlap = sweep_set & pre_set
all_desc = sweep_set | pre_set
print("AUDIT: sweep-caused desc = %d, pre-existing desc = %d, pre-existing title = %d" %
      (len(sweep_set), len(pre_set), len(pre_title_files)))
print("AUDIT: overlap = %d, unique desc files = %d" % (len(overlap), len(all_desc)))
for p in sorted(overlap):
    print("  OVERLAP: " + p)

# --- scan dist ---
desc_re = re.compile(r'<meta\s+name="description"\s+content="([^"]*)"', re.I)
title_re = re.compile(r"<title>(.*?)</title>", re.I | re.S)
noindex_re = re.compile(r'<meta\s+name="robots"\s+content="[^"]*noindex', re.I)

rows = []       # (decoded_len, url, decoded_desc)
title_rows = [] # (decoded_len, url)
n_pages = 0
for dirpath, dirnames, filenames in os.walk(DIST):
    for fn in filenames:
        if fn != "index.html" and not fn.endswith(".html"):
            continue
        fp = os.path.join(dirpath, fn)
        with io.open(fp, encoding="utf-8", errors="replace") as f:
            head = f.read(20000)
        if noindex_re.search(head) or "Redirecting to:" in head:
            continue  # redirect emissions
        n_pages += 1
        url = os.path.relpath(fp, DIST).replace("\\", "/")
        m = desc_re.search(head)
        if m:
            d = html.unescape(m.group(1))
            rows.append((len(d), url, d))
        m2 = title_re.search(head)
        if m2:
            t = html.unescape(m2.group(1).strip())
            title_rows.append((len(t), url))

over = [r for r in rows if r[0] > 160]
b1 = [r for r in over if 161 <= r[0] <= 180]
b2 = [r for r in over if 181 <= r[0] <= 200]
b3 = [r for r in over if r[0] > 200]
over.sort(reverse=True)
print("\nDIST: pages scanned = %d, with desc = %d" % (n_pages, len(rows)))
print("DIST: over-160 = %d  (161-180: %d, 181-200: %d, >200: %d)" %
      (len(over), len(b1), len(b2), len(b3)))
if over:
    print("DIST: worst = %d chars | %s" % (over[0][0], over[0][1]))
    print("       %s" % over[0][2])
print("DIST: max desc length overall = %d" % max(r[0] for r in rows))

t_over = sorted([t for t in title_rows if t[0] > 60], reverse=True)
print("\nDIST: titles over 60 = %d" % len(t_over))
for ln, url in t_over[:40]:
    print("  title %d | %s" % (ln, url))

# dump over-160 list for the fix stage
outp = os.path.join(ROOT, "audit-output", "meta-desc-over160-dist.txt")
with io.open(outp, "w", encoding="utf-8") as f:
    for ln, url, d in over:
        f.write("%d\t%s\t%s\n" % (ln, url, d))
print("\nwrote " + outp)
