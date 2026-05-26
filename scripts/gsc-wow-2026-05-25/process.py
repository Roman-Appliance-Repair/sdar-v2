"""Process WoW dynamics: last7d (2026-05-18..24) vs prev7d (2026-05-11..17).

Raw JSONs are loaded from audit-output/gsc-call-3-last7d.json and gsc-call-4-prev7d.json
(written by sibling write_raw.py).

Output: audit-output/gsc-wow-dynamics.md
"""

import json, collections, os

OUT_DIR = r'C:\Users\Roman\WebstormProjects\sdar-v2\audit-output'
LAST_PATH = os.path.join(OUT_DIR, 'gsc-call-3-last7d.json')
PREV_PATH = os.path.join(OUT_DIR, 'gsc-call-4-prev7d.json')
MD_PATH = os.path.join(OUT_DIR, 'gsc-wow-dynamics.md')

with open(LAST_PATH, 'r', encoding='utf-8') as f:
    last_data = json.load(f)
with open(PREV_PATH, 'r', encoding='utf-8') as f:
    prev_data = json.load(f)

last_rows = {r['page']: r for r in last_data['rows']}
prev_rows = {r['page']: r for r in prev_data['rows']}

all_pages = set(last_rows) | set(prev_rows)

def short(u):
    return u.replace('https://samedayappliance.repair', '') or '/'

# Build combined rows
combined = []
for p in all_pages:
    l = last_rows.get(p)
    pr = prev_rows.get(p)
    row = {
        'page': p,
        'impr_last': l['impressions'] if l else 0,
        'impr_prev': pr['impressions'] if pr else 0,
        'clk_last': l['clicks'] if l else 0,
        'clk_prev': pr['clicks'] if pr else 0,
        'pos_last': l['position'] if l else None,
        'pos_prev': pr['position'] if pr else None,
    }
    row['delta_impr'] = row['impr_last'] - row['impr_prev']
    row['delta_clk'] = row['clk_last'] - row['clk_prev']
    combined.append(row)

# Totals
def weighted_pos(rows_by_page):
    num = sum(r['position'] * r['impressions'] for r in rows_by_page.values() if r['impressions'] > 0)
    den = sum(r['impressions'] for r in rows_by_page.values())
    return num / den if den else 0

tot_last_clk = sum(r['clicks'] for r in last_rows.values())
tot_prev_clk = sum(r['clicks'] for r in prev_rows.values())
tot_last_imp = sum(r['impressions'] for r in last_rows.values())
tot_prev_imp = sum(r['impressions'] for r in prev_rows.values())
pages_last = sum(1 for r in last_rows.values() if r['impressions'] > 0)
pages_prev = sum(1 for r in prev_rows.values() if r['impressions'] > 0)
avg_pos_last = weighted_pos(last_rows)
avg_pos_prev = weighted_pos(prev_rows)

def delta_pct(new, old):
    if old == 0:
        return '—' if new == 0 else '+∞'
    return f'{(new-old)/old*100:+.1f}%'

# New / Lost
new_pages = sorted([r for r in combined if r['impr_prev'] == 0 and r['impr_last'] > 0],
                   key=lambda r: r['impr_last'], reverse=True)
lost_pages = sorted([r for r in combined if r['impr_last'] == 0 and r['impr_prev'] > 0],
                    key=lambda r: r['impr_prev'], reverse=True)

# Winners / Losers (only pages present in BOTH periods to get real delta; pure-new go in New section)
both = [r for r in combined if r['impr_last'] > 0 and r['impr_prev'] > 0]
winners = sorted(both, key=lambda r: r['delta_impr'], reverse=True)[:15]
losers = sorted(both, key=lambda r: r['delta_impr'])[:15]

# Build markdown
lines = []
lines.append('# GSC week-over-week dynamics')
lines.append('')
lines.append('- Property: `sc-domain:samedayappliance.repair`')
lines.append('- Last 7d: **2026-05-18 → 2026-05-24**')
lines.append('- Prev 7d: **2026-05-11 → 2026-05-17**')
lines.append('- Limit: top 100 pages by impressions per window (per task spec; both windows have `has_more: true` — long tail not captured)')
lines.append('')
lines.append('## Totals comparison')
lines.append('')
lines.append('| Metric | Last 7d | Prev 7d | Delta | Delta % |')
lines.append('|---|---:|---:|---:|---:|')
lines.append(f'| Clicks | {tot_last_clk} | {tot_prev_clk} | {tot_last_clk-tot_prev_clk:+d} | {delta_pct(tot_last_clk, tot_prev_clk)} |')
lines.append(f'| Impressions | {tot_last_imp:,} | {tot_prev_imp:,} | {tot_last_imp-tot_prev_imp:+,} | {delta_pct(tot_last_imp, tot_prev_imp)} |')
lines.append(f'| Unique pages w/ impressions | {pages_last} | {pages_prev} | {pages_last-pages_prev:+d} | {delta_pct(pages_last, pages_prev)} |')
lines.append(f'| Avg position (impr-weighted) | {avg_pos_last:.1f} | {avg_pos_prev:.1f} | {avg_pos_last-avg_pos_prev:+.1f} | — |')
lines.append('')

def page_table(title, rows, sort_asc=False):
    lines.append(f'## {title}')
    lines.append('')
    if not rows:
        lines.append('_(empty)_')
        lines.append('')
        return
    lines.append('| Page | Δ impr | Impr last | Impr prev | Clk last | Clk prev | Pos last | Pos prev |')
    lines.append('|---|---:|---:|---:|---:|---:|---:|---:|')
    for r in rows:
        pl = f'{r["pos_last"]:.1f}' if r['pos_last'] is not None else '—'
        pp = f'{r["pos_prev"]:.1f}' if r['pos_prev'] is not None else '—'
        lines.append(f'| `{short(r["page"])}` | {r["delta_impr"]:+d} | {r["impr_last"]} | {r["impr_prev"]} | {r["clk_last"]} | {r["clk_prev"]} | {pl} | {pp} |')
    lines.append('')

page_table('Top 15 WINNERS (biggest impression growth, present in both periods)', winners)
page_table('Top 15 LOSERS (biggest impression decline, present in both periods)', losers)

lines.append('## New pages (appeared in last7, absent in prev7)')
lines.append('')
if new_pages:
    lines.append('| Page | Impr last | Clk last | Pos last |')
    lines.append('|---|---:|---:|---:|')
    for r in new_pages[:30]:
        pl = f'{r["pos_last"]:.1f}' if r['pos_last'] is not None else '—'
        lines.append(f'| `{short(r["page"])}` | {r["impr_last"]} | {r["clk_last"]} | {pl} |')
    if len(new_pages) > 30:
        lines.append(f'| _… {len(new_pages)-30} more_ | | | |')
else:
    lines.append('_(none)_')
lines.append('')

lines.append('## Lost pages (in prev7 but absent in last7)')
lines.append('')
if lost_pages:
    lines.append('| Page | Impr prev | Clk prev | Pos prev |')
    lines.append('|---|---:|---:|---:|')
    for r in lost_pages[:30]:
        pp = f'{r["pos_prev"]:.1f}' if r['pos_prev'] is not None else '—'
        lines.append(f'| `{short(r["page"])}` | {r["impr_prev"]} | {r["clk_prev"]} | {pp} |')
    if len(lost_pages) > 30:
        lines.append(f'| _… {len(lost_pages)-30} more_ | | | |')
else:
    lines.append('_(none)_')
lines.append('')

# Pattern analysis for verdict
def section(url):
    s = short(url)
    if s == '/': return 'homepage'
    seg = s.strip('/').split('/')[0]
    return seg

loser_sections = collections.Counter(section(r['page']) for r in losers if r['delta_impr'] < 0)
winner_sections = collections.Counter(section(r['page']) for r in winners if r['delta_impr'] > 0)
lost_sections = collections.Counter(section(r['page']) for r in lost_pages)

# Big movers
biggest_winner = winners[0] if winners and winners[0]['delta_impr'] > 0 else None
biggest_loser = losers[0] if losers and losers[0]['delta_impr'] < 0 else None
biggest_lost = lost_pages[0] if lost_pages else None

lines.append('## Verdict')
lines.append('')

verdict = []
imp_change = tot_last_imp - tot_prev_imp
imp_pct = (imp_change/tot_prev_imp*100) if tot_prev_imp else 0
clk_change = tot_last_clk - tot_prev_clk

if imp_change < 0:
    verdict.append(f'1. **Индекс сжимается**: показы упали с {tot_prev_imp:,} до {tot_last_imp:,} ({imp_pct:+.1f}%), клики {tot_prev_clk}→{tot_last_clk} ({clk_change:+d}). Это не сезонный шум — это ощутимый минус за неделю.')
else:
    verdict.append(f'1. **Индекс растёт**: показы {tot_prev_imp:,}→{tot_last_imp:,} ({imp_pct:+.1f}%), клики {tot_prev_clk}→{tot_last_clk} ({clk_change:+d}).')

# Page count
if pages_last < pages_prev:
    verdict.append(f'2. **Уникальных страниц в выдаче меньше**: {pages_prev}→{pages_last} ({pages_last-pages_prev:+d}). То есть сайт показывается на меньшем числе страниц — часть страниц вообще выпала из top-100 по impressions за неделю.')
elif pages_last > pages_prev:
    verdict.append(f'2. Страниц в выдаче чуть больше: {pages_prev}→{pages_last} ({pages_last-pages_prev:+d}).')
else:
    verdict.append(f'2. Число страниц в выдаче стабильно: {pages_last}.')

# Top 3 to watch
watch = []
if biggest_loser:
    watch.append(f'`{short(biggest_loser["page"])}` ({biggest_loser["delta_impr"]:+d} impr: {biggest_loser["impr_prev"]}→{biggest_loser["impr_last"]}, pos {biggest_loser["pos_prev"]:.1f}→{biggest_loser["pos_last"]:.1f})')
if biggest_lost:
    watch.append(f'`{short(biggest_lost["page"])}` — **полностью выпала** из top-100 (было {biggest_lost["impr_prev"]} impr, pos {biggest_lost["pos_prev"]:.1f})')
if biggest_winner and biggest_winner['delta_impr'] > 0:
    watch.append(f'`{short(biggest_winner["page"])}` (+{biggest_winner["delta_impr"]} impr: {biggest_winner["impr_prev"]}→{biggest_winner["impr_last"]})')

verdict.append(f'3. **Top 3 страницы под наблюдением**: ' + '; '.join(watch) + '.')

# Pattern
patterns_text = []
if loser_sections:
    top_loser_section, top_loser_count = loser_sections.most_common(1)[0]
    patterns_text.append(f'среди топ-15 losers больше всего страниц из секции **`/{top_loser_section}/`** ({top_loser_count} шт)')
if lost_sections:
    top_lost_section, top_lost_count = lost_sections.most_common(1)[0]
    patterns_text.append(f'среди полностью выпавших — секция **`/{top_lost_section}/`** ({top_lost_count} шт)')
if patterns_text:
    verdict.append('4. **Паттерн потерь**: ' + ', '.join(patterns_text) + '.')

# Hidden caveat
verdict.append(f'5. **Caveat**: оба окна capped на 100 строк (`has_more: true`). «Lost pages» могут быть не реально потерянными, а просто вытесненными из top-100 за счёт того, что у других страниц impressions выросли. Реальное число «исчезнувших» страниц нужно проверять без лимита.')

# What to do
verdict.append(f'6. **Рекомендация**: разобраться с **`{short(biggest_loser["page"]) if biggest_loser else "n/a"}`** — самое заметное падение по позиции; и проверить **`{short(biggest_lost["page"]) if biggest_lost else "n/a"}`** на 404/деиндексацию (если страница цела — это просто хвост вылез выше).')

lines.extend(verdict)

with open(MD_PATH, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'markdown saved: {MD_PATH}')
print(f'rows: last7={len(last_rows)}, prev7={len(prev_rows)}, union={len(all_pages)}, both={len(both)}, new={len(new_pages)}, lost={len(lost_pages)}')
print(f'totals: clk {tot_prev_clk}->{tot_last_clk} ({clk_change:+d}); impr {tot_prev_imp:,}->{tot_last_imp:,} ({imp_change:+,}, {imp_pct:+.1f}%)')
