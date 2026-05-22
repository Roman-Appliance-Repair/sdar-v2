import json, pathlib
data = json.loads(pathlib.Path('audit-output/wave-42-all-measurements.json').read_text())
by_path = {d['path']: d['words'] for d in data}
targets = [
    'san-clemente','agoura-hills','west-hollywood','glendale',
    'burbank','beverly-hills','irvine','hollywood',
    'brentwood','bel-air','malibu','book','ai-diagnostic',
    'anaheim','santa-monica','pasadena','los-angeles',
    'ojai','villa-park','contact','privacy-policy','terms',
    'rancho-cucamonga','temecula','thousand-oaks','long-beach','torrance',
    'la-county','orange-county','ventura-county','riverside-county','san-bernardino-county',
]
print('=== Spot-check known top-level pages (city pillars + meta + county hubs) ===')
for t in targets:
    needle = t + '.astro'
    if needle in by_path:
        w = by_path[needle]
        flag = '  STUB' if w < 200 else ''
        print(f'  {w:>5}w  {needle}{flag}')
    else:
        print(f'  ?????  not found: {needle}')

# Show low-content pages that aren't stubs but are below 400w
print()
print('=== Pages 200-399w (low content, not stubs but candidates for enrichment) ===')
low = sorted([d for d in data if 200 <= d['words'] < 400], key=lambda x: x['words'])
for d in low[:50]:
    print(f"  {d['words']:>5}w  {d['path']}")
