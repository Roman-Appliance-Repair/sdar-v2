import re
import os

MANUFACTURER_DATA = {
    'lg.astro':                          ('LG',                 'https://www.lg.com/us/support',                                 'LG official support & manuals'),
    'samsung.astro':                     ('Samsung',            'https://www.samsung.com/us/support/',                           'Samsung appliance support'),
    'sub-zero.astro':                    ('Sub-Zero',           'https://www.subzero-wolf.com/en-us/service-locator',            'Sub-Zero service & warranty'),
    'wolf.astro':                        ('Wolf',               'https://www.subzero-wolf.com/en-us/service-locator',            'Wolf service & warranty'),
    'thermador.astro':                   ('Thermador',          'https://www.thermador.com/us/service',                          'Thermador service center'),
    'viking.astro':                      ('Viking',             'https://www.vikingrange.com/consumer/category/support/',        'Viking support'),
    'miele.astro':                       ('Miele',              'https://www.mieleusa.com/domestic/support-1718.htm',            'Miele official support'),
    'bosch.astro':                       ('Bosch',              'https://www.bosch-home.com/us/service-and-support/',            'Bosch appliance support'),
    'kitchenaid.astro':                  ('KitchenAid',         'https://www.kitchenaid.com/service-and-support.html',           'KitchenAid service'),
    'whirlpool.astro':                   ('Whirlpool',          'https://www.whirlpool.com/service-and-support.html',            'Whirlpool service'),
    'ge.astro':                          ('GE',                 'https://www.geappliances.com/service/',                         'GE Appliances service'),
    'maytag.astro':                      ('Maytag',             'https://www.maytag.com/service-and-support.html',               'Maytag service'),
    'frigidaire.astro':                  ('Frigidaire',         'https://www.frigidaire.com/service-and-support/',               'Frigidaire support'),
    'amana.astro':                       ('Amana',              'https://www.amana.com/service-and-support.html',                'Amana service'),
    'dacor.astro':                       ('Dacor',              'https://www.dacor.com/service-and-support',                     'Dacor service & support'),
    'jennair.astro':                     ('JennAir',            'https://www.jennair.com/service-and-support.html',              'JennAir service'),
    'haier.astro':                       ('Haier',              'https://www.haieramerica.com/support',                          'Haier appliance support'),
    'electrolux.astro':                  ('Electrolux',         'https://www.electroluxappliances.com/service-and-support/',     'Electrolux service'),
    'sharp.astro':                       ('Sharp',              'https://www.sharpusa.com/support',                              'Sharp appliance support'),
    'panasonic.astro':                   ('Panasonic',          'https://www.panasonic.com/us/support',                          'Panasonic support'),
    'zephyr.astro':                      ('Zephyr',             'https://zephyronline.com/support/',                             'Zephyr ventilation support'),
    'broan.astro':                       ('Broan',              'https://www.broan-nutone.com/en-us/support',                    'Broan-NuTone support'),
    'bertazzoni.astro':                  ('Bertazzoni',         'https://www.bertazzoni.com/service-and-support',                'Bertazzoni service'),
    'fisher-paykel.astro':               ('Fisher & Paykel',    'https://www.fisherpaykel.com/us/support/',                      'Fisher & Paykel support'),
    'asko.astro':                        ('Asko',               'https://www.askousa.com/support',                               'Asko appliance support'),
    'liebherr.astro':                    ('Liebherr',           'https://home.liebherr.com/en/usa/support/support.html',         'Liebherr home support'),
    'u-line.astro':                      ('U-Line',             'https://www.u-line.com/support/',                               'U-Line support'),
    'marvel.astro':                      ('Marvel',             'https://www.marvelrefrigeration.com/support/',                  'Marvel refrigeration support'),
    'kenmore.astro':                     ('Kenmore',            'https://www.kenmore.com/support',                               'Kenmore support'),
    'magic-chef.astro':                  ('Magic Chef',         'https://www.magicchef.com/support',                             'Magic Chef support'),
    'hoshizaki.astro':                   ('Hoshizaki',          'https://www.hoshizaki.com/service-and-support/',                'Hoshizaki service & parts'),
    'manitowoc.astro':                   ('Manitowoc',          'https://www.manitowocice.com/en-us/service',                    'Manitowoc Ice service locator'),
    'true.astro':                        ('True Refrigeration', 'https://www.truemfg.com/service-and-support/',                  'True Refrigeration service'),
    'traulsen.astro':                    ('Traulsen',           'https://www.traulsen.com/service-repair/',                      'Traulsen service & repair'),
    'vulcan.astro':                      ('Vulcan',             'https://www.vulcanequipment.com/service-support/',              'Vulcan Equipment support'),
    'delfield.astro':                    ('Delfield',           'https://www.delfield.com/service-support/',                     'Delfield service support'),
    'scotsman-ice-machine-repair.astro': ('Scotsman',           'https://www.scotsman-ice.com/service',                          'Scotsman Ice service'),
    'hobart-dishwasher-repair.astro':    ('Hobart',             'https://www.hobartcorp.com/service',                            'Hobart service'),
    'rational-combi-oven-repair.astro':  ('Rational',           'https://www.rational-online.com/us/service/',                   'Rational service'),
    'perlick-commercial.astro':          ('Perlick',            'https://www.perlick.com/service/',                              'Perlick service'),
    'perlick-draft-beer-system-repair.astro':    ('Perlick',    'https://www.perlick.com/service/',                              'Perlick service'),
    'perlick-outdoor-refrigerator-repair.astro': ('Perlick',    'https://www.perlick.com/service/',                              'Perlick service'),
    'perlick-refrigerator-repair.astro': ('Perlick',            'https://www.perlick.com/service/',                              'Perlick service'),
    'whisperkool.astro':                 ('WhisperKool',        'https://www.whisperkool.com/support/',                          'WhisperKool support'),
    'cellarpro.astro':                   ('CellarPro',          'https://www.cellarpro.com/support/',                            'CellarPro support'),
    'breezaire.astro':                   ('Breezaire',          'https://www.breezaire.com/support/',                            'Breezaire support'),
    'beverage-air.astro':                ('Beverage-Air',       'https://www.beverage-air.com/service-parts/',                   'Beverage-Air service & parts'),
    'speed-queen.astro':                 ('Speed Queen',        'https://www.speedqueen.com/service-and-support/',               'Speed Queen support'),
    'blustar.astro':                     ('BlueStar',           'https://www.bluestarcooking.com/support/',                      'BlueStar support'),
    'gaggenau.astro':                    ('Gaggenau',           'https://www.gaggenau.com/us/service',                           'Gaggenau service'),
    'smeg.astro':                        ('Smeg',               'https://www.smegusa.com/service-and-support/',                  'Smeg service'),
    'ilve.astro':                        ('ILVE',               'https://www.ilveusa.com/support/',                              'ILVE support'),
    'hestan.astro':                      ('Hestan',             'https://www.hestan.com/support/',                               'Hestan support'),
    'signature-kitchen-suite.astro':     ('SKS',                'https://www.signaturekitchensuite.com/support/',                'Signature Kitchen Suite support'),
    'cove.astro':                        ('Cove',               'https://www.covehomeappliances.com/en-us/service-locator',      'Cove service locator'),
    'monogram.astro':                    ('GE Monogram',        'https://www.monogram.com/service-and-support',                  'GE Monogram service'),
    'cafe.astro':                        ('GE Café',            'https://www.cafeappliances.com/service-and-support.html',       'GE Café service'),
    'profile.astro':                     ('GE Profile',         'https://www.geappliances.com/service/',                         'GE Profile service'),
}

BRANDS_DIR = 'src/pages/brands'
# Idempotency: detect via the unique question text, which appears in both
# the faqs[] entry and the <details> templates regardless of strategy used.
SKIP_MARKER = 'Where can I find the official'
# Stable slug for the data-tag attribute on inserted <details> blocks.
DATA_TAG = 'manufacturer-resource-faq'

def build_faq_entry(brand, url, anchor):
    return f'''    {{
      q: "Where can I find the official {brand} manual or warranty information?",
      a: `For official {brand} documentation, warranty registration, and authorized service locator, visit <a href="{url}" rel="nofollow noopener" target="_blank">{anchor}</a>. Our technicians work independently of {brand}'s factory service network - we're often faster and available same-day in Southern California.`
    }},'''

def build_details_entry(brand, url, anchor):
    return f'''
  <details class="faq-item" data-tag="{DATA_TAG}">
    <summary>Where can I find the official {brand} manual or warranty information?</summary>
    <p>For official {brand} documentation, warranty registration, and authorized service locator, visit <a href="{url}" rel="nofollow noopener" target="_blank">{anchor}</a>. Our technicians work independently of {brand}'s factory service network - we're often faster and available same-day in Southern California.</p>
  </details>'''

def build_faq_class_entry(brand, url, anchor, indent='      '):
    return (
        f'\n{indent}<details class="faq" data-tag="{DATA_TAG}">'
        f'\n{indent}  <summary>Where can I find the official {brand} manual or warranty information?</summary>'
        f'\n{indent}  <p>For official {brand} documentation, warranty registration, and authorized service locator, visit <a href="{url}" rel="nofollow noopener" target="_blank">{anchor}</a>. Our technicians work independently of {brand}\'s factory service network - we\'re often faster and available same-day in Southern California.</p>'
        f'\n{indent}</details>'
    )

results = []

for filename, (brand, url, anchor) in MANUFACTURER_DATA.items():
    filepath = os.path.join(BRANDS_DIR, filename)
    if not os.path.exists(filepath):
        results.append(f'SKIP (not found): {filename}')
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if SKIP_MARKER in content:
        results.append(f'SKIP (already done): {filename}')
        continue

    # Strategy 1: faqs[] array - insert before closing ];
    faqs_match = re.search(r'(const faqs\s*=\s*\[)(.*?)(\];)', content, re.DOTALL)
    if faqs_match:
        arr_content = faqs_match.group(2)
        # If the last existing entry has no trailing comma, add one. Idempotent:
        # the regex \}\s*$ requires `}` followed by ONLY whitespace through EOS,
        # so `},\n  ` (already comma-terminated) won't match.
        arr_content = re.sub(r'\}(\s*)$', r'},\1', arr_content)
        new_entry = build_faq_entry(brand, url, anchor)
        new_faqs = faqs_match.group(1) + arr_content + new_entry + '\n  ' + faqs_match.group(3)
        content = content[:faqs_match.start()] + new_faqs + content[faqs_match.end():]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        results.append(f'OK (faqs[] array): {filename}')
        continue

    # Strategy 2: hand-written <details> blocks - insert before </div> of faq section
    faq_section = re.search(r'(<div[^>]*class="[^"]*faq[^"]*"[^>]*>)(.*?)(</div>)', content, re.DOTALL)
    if faq_section:
        new_entry = build_details_entry(brand, url, anchor)
        new_section = faq_section.group(1) + faq_section.group(2) + new_entry + '\n' + faq_section.group(3)
        content = content[:faq_section.start()] + new_section + content[faq_section.end():]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        results.append(f'OK (details block): {filename}')
        continue

    # Strategy 3: bare <details class="faq">...</details> blocks (no wrapping div).
    # Insert a new <details> block right after the last one.
    matches = list(re.finditer(r'<details class="faq">.*?</details>', content, re.DOTALL))
    if matches:
        last = matches[-1]
        # Detect indent of the matched <details> line
        line_start = content.rfind('\n', 0, last.start()) + 1
        indent = content[line_start:last.start()]
        new_entry = build_faq_class_entry(brand, url, anchor, indent=indent)
        content = content[:last.end()] + new_entry + content[last.end():]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        results.append(f'OK (bare details.faq): {filename}')
        continue

    results.append(f'MANUAL NEEDED (no pattern matched): {filename}')

print('\n'.join(results))
