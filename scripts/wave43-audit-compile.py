import json, os, re

with open('C:/Users/Roman/AppData/Local/Temp/wave43-audit.json', encoding='utf-8') as f:
    data = json.load(f)

def tier(r):
    if r['status'] == 'MISSING': return 'T1-missing'
    if r['status'] == 'STUB': return 'T2-stub-rewrite'
    if r['status'] == 'PARTIAL': return 'T3-extend'
    if r['status'] == 'FULL':
        if r['in_links'] <= 2: return 'T4-link-only'
        return 'T5-ready'
    return '-'

for r in data: r['tier'] = tier(r)

DISPLAY = {
    'electrolux': 'Electrolux', 'bertazzoni': 'Bertazzoni',
    'fisher-paykel': 'Fisher & Paykel', 'asko': 'Asko', 'liebherr': 'Liebherr',
    'u-line': 'U-Line', 'marvel': 'Marvel', 'speed-queen': 'Speed Queen',
    'bluestar': 'BlueStar', 'gaggenau': 'Gaggenau', 'smeg': 'Smeg',
    'ilve': 'ILVE', 'hestan': 'Hestan', 'signature-kitchen-suite': 'Signature Kitchen Suite',
    'ge-monogram': 'GE Monogram', 'cafe': 'GE Cafe', 'profile': 'GE Profile',
}

L = []
L.append('# Wave 43 brand pillars - comprehensive audit')
L.append('')
L.append('**Generated:** 2026-05-14 - **Auditor:** T6 (audit-only, no source changes)')
L.append('')
L.append('## Top-line summary')
L.append('')
status_count = {}
for r in data: status_count[r['status']] = status_count.get(r['status'], 0) + 1
L.append('| Status | Count |')
L.append('|---|---|')
for k in ['FULL', 'PARTIAL', 'STUB', 'MISSING']:
    if k in status_count: L.append('| ' + k + ' | ' + str(status_count[k]) + ' |')
L.append('| **Total** | **' + str(len(data)) + '** |')
L.append('')
L.append('### Critical finding - Wave 43 already shipped')
L.append('')
L.append('**All 17 target brand pillars already exist as files on `main`.** None are MISSING; none are STUB. The Wave 43 backlog appears to be partially executed already:')
L.append('- **14 pillars FULL** (1800-2823 body words, complete pillar voice)')
L.append('- **3 pillars PARTIAL** (1596-1633 body words - `ilve`, `hestan`, `signature-kitchen-suite`) need ~200-250 words expansion to reach 1800+ target.')
L.append('- 0 STUB, 0 MISSING.')
L.append('')
L.append('## Per-brand summary table')
L.append('')
L.append('| Brand | Slug | Status | Body wd | Combos | In-links | Tier | Notes |')
L.append('|---|---|---|---|---|---|---|---|')
for r in data:
    name = DISPLAY[r['slug']]
    notes = ', '.join(r['notes']) if r['notes'] else 'ok'
    L.append('| ' + name + ' | `' + r['slug'] + '` | ' + r['status'] + ' | ' + str(r['body_words']) + ' | ' + str(r['combo_count']) + ' | ' + str(r['in_links']) + ' | ' + r['tier'] + ' | ' + notes + ' |')
L.append('')

L.append('## Tier definitions')
L.append('')
L.append('| Tier | Meaning | Action |')
L.append('|---|---|---|')
L.append('| **T5-ready** | FULL pillar, >=3 in-links - no action needed | None |')
L.append('| **T4-link-only** | FULL pillar, <=2 in-links - orphan-adjacent | Add internal links from hubs / siblings |')
L.append('| **T3-extend** | PARTIAL pillar (1000-1799 wd) | Extend to 1800+ wd, preserve voice |')
L.append('| **T2-stub-rewrite** | STUB pillar (<1000 wd) | Full content rewrite |')
L.append('| **T1-missing** | File does not exist | Create from scratch |')
L.append('')

L.append('## Recommended batch grouping')
L.append('')
batches = {}
for r in data: batches.setdefault(r['tier'], []).append(r)
for t in ['T1-missing', 'T2-stub-rewrite', 'T3-extend', 'T4-link-only', 'T5-ready']:
    if t in batches:
        L.append('### ' + t + ' (' + str(len(batches[t])) + ')')
        for r in batches[t]:
            L.append('- **' + DISPLAY[r['slug']] + '** (`' + r['slug'] + '.astro`) - ' + str(r['body_words']) + ' wd, ' + str(r['combo_count']) + ' combos, ' + str(r['in_links']) + ' in-links')
        L.append('')

L.append('## Per-brand detail')
L.append('')
for r in data:
    L.append('### ' + DISPLAY[r['slug']] + ' (`' + r['slug'] + '`)')
    L.append('- **File:** `src/pages/brands/' + r['slug'] + '.astro`')
    L.append('- **Body words:** ' + str(r['body_words']) + ' (' + r['status'] + ')')
    L.append('- **Combo prefix:** `' + r['combo_prefix'] + '-*` - ' + str(r['combo_count']) + ' combo pages')
    if r['combo_paths']:
        for p in r['combo_paths'][:8]:
            L.append('  - `' + os.path.basename(p) + '`')
        if len(r['combo_paths']) > 8:
            L.append('  - ...+' + str(len(r['combo_paths'])-8) + ' more')
    L.append('- **Incoming dofollow links:** ' + str(r['in_links']))
    if r['in_link_files']:
        for f in r['in_link_files'][:5]:
            L.append('  - `' + f + '`')
        if len(r['in_link_files']) > 5:
            L.append('  - ...+' + str(len(r['in_link_files'])-5) + ' more')
    L.append('- **Schema/canonical notes:** ' + (', '.join(r['notes']) if r['notes'] else 'clean'))
    L.append('- **Tier:** ' + r['tier'])
    L.append('')

L.append('## Architectural flags')
L.append('')
L.append('1. **`cafe` / `profile` slug vs `ge-cafe-*` / `ge-profile-*` combos asymmetry.** Pillar URLs are `/brands/cafe/` + `/brands/profile/` but their combos live at `/brands/ge-cafe-{appliance}-repair/` + `/brands/ge-profile-{appliance}-repair/`. Possible cause: Wave 39 title sweep collapsed display names. Decision needed: rename pillar files to `ge-cafe.astro` + `ge-profile.astro` (with 301 from `cafe`/`profile`) OR rename combos under the bare slug. Affects internal-link structure for these two GE-family brands.')
L.append('')
L.append('2. **`cafe` + `profile` orphan-adjacent (1 in-link each).** Both FULL-content pillars but almost no internal links pointing to them.')
L.append('')
L.append('3. **`liebherr` + `marvel` orphan-adjacent (2 in-links each).** Same pattern at smaller scale - FULL content sitting in indexable state but not linked.')
L.append('')

L.append('## Wiki cluster plan check (STEP 3)')
L.append('')
L.append('No Wave 43 / cluster-6 dedicated plan in `sdar-v2-wiki`. All 17 brands have mentions in:')
L.append('- `wiki/decisions/legacy-migration-301-manifest.md` (redirect manifest)')
L.append('- `wiki/decisions/pre-launch-checklist.md` (pre-launch tracking)')
L.append('- `wiki/handoff/2026-04-20-session-handoff.md` (early planning notes)')
L.append('- Various terminal pause files (T1/T2/T6/T-HUB)')
L.append('')
L.append('No `wiki/page-plans/cluster-6-*/` directories exist. Wave 43 was executed without a formal cluster plan checked into wiki - pillars were written ad-hoc per session.')
L.append('')

L.append('## Data layer mentions (STEP 4)')
L.append('')
L.append('Brands surface in `src/data/` minimally:')
L.append('- `city-service-content.ts` - brand pools per city tier (most brand mentions live here)')
L.append('- `homepage-services.ts` - popular brand showcase on homepage')
L.append('- `faq.ts` - brand-named FAQ answers')
L.append('')
L.append('No dedicated `brand-facts.ts` SSOT - brand facts (ownership, country, product line) live inline in each pillar `.astro` file.')
L.append('')

L.append('## Notion MCP (STEP 6)')
L.append('')
L.append('**Not available in current MCP inventory.** Available MCPs: `gsc`, `claude_ai_Ahrefs`, `ide`, `n8n-mcp`. No `notion` MCP. Roman accesses Notion writing standard + brand tracker through browser manually.')
L.append('')

L.append('## Open questions for Roman')
L.append('')
L.append('1. **3 PARTIAL pillars** (`ilve` 1633 wd, `hestan` 1596 wd, `signature-kitchen-suite` 1619 wd) - acceptable as-is given their niche scope, or extend to >=1800 wd?')
L.append('2. **`cafe` / `profile` slug vs `ge-cafe-*` / `ge-profile-*` combos** - current asymmetry: keep both forms (with cross-link), unify to `ge-cafe.astro` (+ 301 from `cafe`), or unify combos to `cafe-*`?')
L.append('3. **Orphan FULL pillars** (`cafe`, `profile`, `liebherr`, `marvel` - 1-2 in-links each) - schedule internal linking sweep from `/brands/` hub and related service hubs?')
L.append('4. **Wave 43 retrospective** - write a `wiki/page-plans/wave-43-brand-pillars/` summary doc capturing what was shipped, since pillars were authored without a formal cluster plan?')

out_path = 'audit-output/wave-43-brand-pillar-audit.md'
os.makedirs('audit-output', exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(L))

print('WROTE:', out_path)
print('Lines:', len(L))
print('Bytes:', os.path.getsize(out_path))
