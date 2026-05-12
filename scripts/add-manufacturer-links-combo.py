import re
import os
import glob

BRANDS_DIR = 'src/pages/brands'
SKIP_MARKER = 'Where can I find the official'
DATA_TAG = 'manufacturer-resource-faq'

BRAND_DATA = {
    'lg':                    ('LG',                 'https://www.lg.com/us/support',                                 'LG official support & manuals'),
    'samsung':               ('Samsung',            'https://www.samsung.com/us/support/',                           'Samsung appliance support'),
    'sub-zero':              ('Sub-Zero',           'https://www.subzero-wolf.com/en-us/service-locator',            'Sub-Zero service & warranty'),
    'wolf':                  ('Wolf',               'https://www.subzero-wolf.com/en-us/service-locator',            'Wolf service & warranty'),
    'thermador':             ('Thermador',          'https://www.thermador.com/us/service',                          'Thermador service center'),
    'viking':                ('Viking',             'https://www.vikingrange.com/consumer/category/support/',        'Viking support'),
    'miele':                 ('Miele',              'https://www.mieleusa.com/domestic/support-1718.htm',            'Miele official support'),
    'bosch':                 ('Bosch',              'https://www.bosch-home.com/us/service-and-support/',            'Bosch appliance support'),
    'kitchenaid':            ('KitchenAid',         'https://www.kitchenaid.com/service-and-support.html',           'KitchenAid service'),
    'whirlpool':             ('Whirlpool',          'https://www.whirlpool.com/service-and-support.html',            'Whirlpool service'),
    'ge':                    ('GE',                 'https://www.geappliances.com/service/',                         'GE Appliances service'),
    'maytag':                ('Maytag',             'https://www.maytag.com/service-and-support.html',               'Maytag service'),
    'frigidaire':            ('Frigidaire',         'https://www.frigidaire.com/service-and-support/',               'Frigidaire support'),
    'amana':                 ('Amana',              'https://www.amana.com/service-and-support.html',                'Amana service'),
    'dacor':                 ('Dacor',              'https://www.dacor.com/service-and-support',                     'Dacor service & support'),
    'jennair':               ('JennAir',            'https://www.jennair.com/service-and-support.html',              'JennAir service'),
    'haier':                 ('Haier',              'https://www.haieramerica.com/support',                          'Haier appliance support'),
    'sharp':                 ('Sharp',              'https://www.sharpusa.com/support',                              'Sharp appliance support'),
    'panasonic':             ('Panasonic',          'https://www.panasonic.com/us/support',                          'Panasonic support'),
    'zephyr':                ('Zephyr',             'https://zephyronline.com/support/',                             'Zephyr ventilation support'),
    'broan':                 ('Broan',              'https://www.broan-nutone.com/en-us/support',                    'Broan-NuTone support'),
    'bertazzoni':            ('Bertazzoni',         'https://www.bertazzoni.com/service-and-support',                'Bertazzoni service'),
    'fisher-paykel':         ('Fisher & Paykel',    'https://www.fisherpaykel.com/us/support/',                      'Fisher & Paykel support'),
    'asko':                  ('Asko',               'https://www.askousa.com/support',                               'Asko appliance support'),
    'liebherr':              ('Liebherr',           'https://home.liebherr.com/en/usa/support/support.html',         'Liebherr home support'),
    'u-line':                ('U-Line',             'https://www.u-line.com/support/',                               'U-Line support'),
    'marvel':                ('Marvel',             'https://www.marvelrefrigeration.com/support/',                  'Marvel refrigeration support'),
    'kenmore':               ('Kenmore',            'https://www.kenmore.com/support',                               'Kenmore support'),
    'magic-chef':            ('Magic Chef',         'https://www.magicchef.com/support',                             'Magic Chef support'),
    'hoshizaki':             ('Hoshizaki',          'https://www.hoshizaki.com/service-and-support/',                'Hoshizaki service & parts'),
    'manitowoc':             ('Manitowoc',          'https://www.manitowocice.com/en-us/service',                    'Manitowoc Ice service locator'),
    'true':                  ('True Refrigeration', 'https://www.truemfg.com/service-and-support/',                  'True Refrigeration service'),
    'traulsen':              ('Traulsen',           'https://www.traulsen.com/service-repair/',                      'Traulsen service & repair'),
    'vulcan':                ('Vulcan',             'https://www.vulcanequipment.com/service-support/',              'Vulcan Equipment support'),
    'delfield':              ('Delfield',           'https://www.delfield.com/service-support/',                     'Delfield service support'),
    'scotsman':              ('Scotsman',           'https://www.scotsman-ice.com/service',                          'Scotsman Ice service'),
    'hobart':                ('Hobart',             'https://www.hobartcorp.com/service',                            'Hobart service'),
    'rational':              ('Rational',           'https://www.rational-online.com/us/service/',                   'Rational service'),
    'perlick':               ('Perlick',            'https://www.perlick.com/service/',                              'Perlick service'),
    'whisperkool':           ('WhisperKool',        'https://www.whisperkool.com/support/',                          'WhisperKool support'),
    'cellarpro':             ('CellarPro',          'https://www.cellarpro.com/support/',                            'CellarPro support'),
    'breezaire':             ('Breezaire',          'https://www.breezaire.com/support/',                            'Breezaire support'),
    'beverage-air':          ('Beverage-Air',       'https://www.beverage-air.com/service-parts/',                   'Beverage-Air service & parts'),
    'speed-queen':           ('Speed Queen',        'https://www.speedqueen.com/service-and-support/',               'Speed Queen support'),
    'blustar':               ('BlueStar',           'https://www.bluestarcooking.com/support/',                      'BlueStar support'),
    'gaggenau':              ('Gaggenau',           'https://www.gaggenau.com/us/service',                           'Gaggenau service'),
    'smeg':                  ('Smeg',               'https://www.smegusa.com/service-and-support/',                  'Smeg service'),
    'ilve':                  ('ILVE',               'https://www.ilveusa.com/support/',                              'ILVE support'),
    'hestan':                ('Hestan',             'https://www.hestan.com/support/',                               'Hestan support'),
    'signature-kitchen-suite': ('SKS',             'https://www.signaturekitchensuite.com/support/',                'Signature Kitchen Suite support'),
    'cove':                  ('Cove',               'https://www.covehomeappliances.com/en-us/service-locator',      'Cove service locator'),
    'electrolux':            ('Electrolux',         'https://www.electroluxappliances.com/service-and-support/',     'Electrolux service'),
    'monogram':              ('GE Monogram',        'https://www.monogram.com/service-and-support',                  'GE Monogram service'),
    'cafe':                  ('GE Café',            'https://www.cafeappliances.com/service-and-support.html',       'GE Café service'),
    'profile':               ('GE Profile',         'https://www.geappliances.com/service/',                         'GE Profile service'),
}

def get_brand_from_filename(filename):
    name = filename.replace('.astro', '')
    for brand_key in sorted(BRAND_DATA.keys(), key=len, reverse=True):
        if name.startswith(brand_key):
            return brand_key
    return None

def build_faq_entry(brand, url, anchor):
    return f'''    {{
      q: "Where can I find the official {brand} manual or warranty information?",
      a: `For official {brand} documentation, warranty registration, and authorized service locator, visit <a href="{url}" rel="nofollow noopener" target="_blank">{anchor}</a>. Our technicians work independently of {brand}'s factory service network - we're often faster and available same-day in Southern California.`
    }},'''

def build_details_entry(brand, url, anchor):
    return f'''  <details class="faq-item" data-tag="{DATA_TAG}">
    <summary>Where can I find the official {brand} manual or warranty information?</summary>
    <p>For official {brand} documentation, warranty registration, and authorized service locator, visit <a href="{url}" rel="nofollow noopener" target="_blank">{anchor}</a>. Our technicians work independently of {brand}'s factory service network - we're often faster and available same-day in Southern California.</p>
  </details>'''

def build_minimal_faq_section(brand, url, anchor):
    entry = build_details_entry(brand, url, anchor)
    return f'''
<section class="section faq-section">
  <h2>Frequently asked</h2>
  {entry}
</section>'''

# Pillar = pure-letter basename only (e.g. lg.astro). Anything with a hyphen
# or digit is a combo/sub-brand page. Hyphenated pillars like sub-zero.astro
# already carry the marker from the previous wave and will be SKIP'd.
PILLAR_PATTERN = re.compile(r'^[a-z]+\.astro$')

results = {'ok_faqs': [], 'ok_details': [], 'ok_minimal': [], 'skip_done': [], 'skip_pillar': [], 'skip_no_brand': [], 'error': []}

all_files = sorted(os.listdir(BRANDS_DIR))
combo_files = [f for f in all_files if f.endswith('.astro') and not PILLAR_PATTERN.match(f)]

for filename in combo_files:
    filepath = os.path.join(BRANDS_DIR, filename)

    brand_key = get_brand_from_filename(filename)
    if not brand_key:
        results['skip_no_brand'].append(filename)
        continue

    brand, url, anchor = BRAND_DATA[brand_key]

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if SKIP_MARKER in content:
        results['skip_done'].append(filename)
        continue

    modified = False

    faqs_match = re.search(r'(const faqs\s*=\s*\[)(.*?)(\];)', content, re.DOTALL)
    if faqs_match:
        inner = faqs_match.group(2)
        last_brace = inner.rfind('}')
        if last_brace != -1 and not inner[last_brace:last_brace+2].strip().startswith(','):
            inner = inner[:last_brace+1] + ',' + inner[last_brace+1:]
        new_entry = '\n' + build_faq_entry(brand, url, anchor)
        new_faqs = faqs_match.group(1) + inner + new_entry + '\n  ' + faqs_match.group(3)
        content = content[:faqs_match.start()] + new_faqs + content[faqs_match.end():]
        modified = True
        results['ok_faqs'].append(filename)

    if not modified:
        faq_div = re.search(r'(<div[^>]*class="[^"]*faq[^"]*"[^>]*>)(.*?)(</div>\s*(?:</section>)?)', content, re.DOTALL)
        if faq_div:
            new_entry = '\n  ' + build_details_entry(brand, url, anchor) + '\n'
            new_section = faq_div.group(1) + faq_div.group(2) + new_entry + faq_div.group(3)
            content = content[:faq_div.start()] + new_section + content[faq_div.end():]
            modified = True
            results['ok_details'].append(filename)

    if not modified:
        details_match = re.search(r'(<details\s+class="faq[^"]*")', content)
        if details_match:
            insert_pos = content.rfind('</details>') + len('</details>')
            new_entry = '\n  ' + build_details_entry(brand, url, anchor)
            content = content[:insert_pos] + new_entry + content[insert_pos:]
            modified = True
            results['ok_details'].append(filename)

    if not modified:
        cta_match = re.search(r'(<section[^>]*class="[^"]*(?:cta|bottom)[^"]*")', content)
        if cta_match:
            content = content[:cta_match.start()] + build_minimal_faq_section(brand, url, anchor) + '\n\n' + content[cta_match.start():]
            modified = True
            results['ok_minimal'].append(filename)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        results['error'].append(filename)

print(f"OK faqs[] array:    {len(results['ok_faqs'])} files")
print(f"OK details block:   {len(results['ok_details'])} files")
print(f"OK minimal section: {len(results['ok_minimal'])} files")
print(f"SKIP already done:  {len(results['skip_done'])} files")
print(f"SKIP no brand match:{len(results['skip_no_brand'])} files")
print(f"ERROR no pattern:   {len(results['error'])} files")
if results['error']:
    print("ERROR files:", results['error'])
if results['skip_no_brand']:
    print("No brand match:", results['skip_no_brand'])
