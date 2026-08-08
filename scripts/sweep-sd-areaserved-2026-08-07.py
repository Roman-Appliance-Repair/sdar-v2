# sweep-sd-areaserved-2026-08-07.py — 7th county phase 2: insert San Diego County
# into hardcoded areaServed arrays (JS-object and raw-JSON forms).
# Exact-string insertion AFTER the Riverside entry (geographic order — SD last).
# Idempotence guard: any file already containing the literal 'San Diego County'
# is skipped entirely (data files, county hub, already-correct pages).
# Mirrors scripts/sweep-sb-areaserved-2026-08-06.py (Stage D).
import os, sys, io, collections

APPLY = '--apply' in sys.argv

PAT_JS = "{ '@type': 'AdministrativeArea', name: 'Riverside County' }"
NEW_JS = "{ '@type': 'AdministrativeArea', name: 'Riverside County' }, { '@type': 'AdministrativeArea', name: 'San Diego County' }"
PAT_JSON = '{ "@type": "AdministrativeArea", "name": "Riverside County" }'
NEW_JSON = '{ "@type": "AdministrativeArea", "name": "Riverside County" }, { "@type": "AdministrativeArea", "name": "San Diego County" }'

GUARD = 'San Diego County'
counts = collections.Counter(); files = {}
for dirpath, _, fns in os.walk('src'):
    for fn in fns:
        if not fn.endswith(('.astro', '.ts', '.tsx')) or fn.endswith('.legacy'):
            continue
        p = os.path.normpath(os.path.join(dirpath, fn))
        with io.open(p, encoding='utf-8') as f:
            text = f.read()
        if GUARD in text:
            continue
        n_js, n_json = text.count(PAT_JS), text.count(PAT_JSON)
        if not (n_js or n_json):
            continue
        counts['js'] += n_js; counts['json'] += n_json
        files[p] = n_js + n_json
        if APPLY:
            text = text.replace(PAT_JS, NEW_JS).replace(PAT_JSON, NEW_JSON)
            with io.open(p, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
print(('APPLIED' if APPLY else 'DRY-RUN'),
      f"files={len(files)} js-form={counts['js']} json-form={counts['json']} total={counts['js']+counts['json']}")
