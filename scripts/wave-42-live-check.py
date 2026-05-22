"""Wave 42 — Live indexability check on stubs + thin pages."""
import json, subprocess, pathlib, re, time

# Hard stubs + borderline thin pages worth checking
STUBS_AND_THIN = [
    ('book.astro', 42),
    ('ai-diagnostic.astro', 86),
    ('brands/cellarpro.astro', 247),
    ('brands/whisperkool-wine-cellar-repair.astro', 252),
    ('brands/breezaire.astro', 258),
    ('brands/whisperkool.astro', 259),
    ('brands/u-line-outdoor-refrigerator-repair.astro', 264),
    ('brands/cellarpro-wine-cellar-repair.astro', 267),
    ('brands/perlick-outdoor-refrigerator-repair.astro', 270),
    ('brands/breezaire-wine-cellar-repair.astro', 274),
    ('brands/viking-outdoor-refrigerator-repair.astro', 285),
    ('brands/zephyr.astro', 301),
    ('brands/sub-zero-outdoor-refrigerator-repair.astro', 302),
    ('brands/broan.astro', 369),
    ('brands/panasonic.astro', 397),
]

results = []
for rel, words in STUBS_AND_THIN:
    url = 'https://samedayappliance.repair/' + rel.replace('.astro', '/').replace('\\', '/')
    print(f"Checking {url} ...", flush=True)
    try:
        r = subprocess.run(
            ['curl', '-s', '-L', '-o', '-', '-w', '\n---HTTP_CODE:%{http_code}---', '--max-time', '15', url],
            capture_output=True, timeout=20,
        )
        out = r.stdout.decode('utf-8', errors='replace')
        m = re.search(r'---HTTP_CODE:(\d+)---', out)
        http_code = m.group(1) if m else '?'
        html = out[:m.start()] if m else out
        has_noindex = bool(re.search(r'<meta[^>]+name=[\'"]robots[\'"][^>]*noindex', html, re.IGNORECASE))
        has_canonical_self = bool(re.search(r'<link[^>]+rel=[\'"]canonical[\'"][^>]*' + re.escape(url), html, re.IGNORECASE))
        size = len(html)
    except Exception as e:
        http_code, has_noindex, has_canonical_self, size = 'ERR', None, None, 0
        print(f"  ERROR: {e}")
    results.append({
        'path': rel,
        'url': url,
        'word_count': words,
        'http_code': http_code,
        'noindex': has_noindex,
        'canonical_self': has_canonical_self,
        'response_size': size,
    })
    time.sleep(0.3)  # be polite

print()
print("=== Live indexability results ===")
print(f"  {'words':>5} {'http':>4} {'idx':>3} {'self-can':>8}  url")
for r in results:
    idx = 'NO' if r['noindex'] else ('OK' if r['http_code'] == '200' else '?')
    sc = 'yes' if r['canonical_self'] else 'no'
    print(f"  {r['word_count']:>5} {str(r['http_code']):>4} {idx:>3} {sc:>8}  {r['url']}")

pathlib.Path('audit-output').mkdir(exist_ok=True)
pathlib.Path('audit-output/wave-42-live.json').write_text(
    json.dumps(results, indent=2), encoding='utf-8'
)
print(f"\nSaved: audit-output/wave-42-live.json")
