#!/usr/bin/env python3
"""TF-IDF cosine scoring per docs/methodology.md §3 — sklearn ONLY, no fallback.

Scores our authored body prose against a competitor corpus for one market.
Refuses to run without scikit-learn (the pure-python approximation produced
uncalibrated numbers twice in 2026-08 — never again).

Usage:
  py scripts/seo-brief/tfidf-score.py --config market.json [--json out.json]

Config (JSON):
  {
    "market": "santa-barbara",
    "cache_dir": "outputs/tfidf-cache/santa-barbara",   // competitor HTML cache
    "competitors": [                                     // re-fetched if cache missing
      {"name": "yost", "url": "https://yostappliance.com/"},
      ...
    ],
    "pages": [                                           // our dist HTML files
      {"slug": "santa-barbara", "path": "dist/santa-barbara/index.html"},
      ...
    ],
    "band": [0.40, 0.55]
  }

Chrome stripping (both sides — scoring full rendered pages was the second
reason earlier numbers were unusable):
  competitors: <script>/<style>/<noscript>/<header>/<footer>/<nav>/<form>/
               <iframe>/<svg> removed, then visible text.
  our pages:   same tags PLUS sections v2-trust / v2-services / v2-nearby /
               v2-final / bottom-cta, and the county-coverage link grid on
               v2 city pillars (class="section" when page has v2-hero).
               Header/footer removal also drops the NAP block and the
               credentials line (both live in Footer.astro).
"""
import argparse
import json
import re
import socket
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    sys.exit("FATAL: scikit-learn is not installed. Install it (py -m pip install "
             "scikit-learn) — this script must NOT fall back to approximations.")

# ---------------------------------------------------------------- IPv4 force
# Windows box has an IPv6 blackhole to some hosts (see memory: GSC direct fix).
_real_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _real_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

STRIP_TAGS = {"script", "style", "noscript", "header", "footer", "nav",
              "form", "iframe", "svg", "template"}


class TextExtractor(HTMLParser):
    """Visible-text extractor that skips STRIP_TAGS subtrees and, optionally,
    <section> elements whose class matches strip_section_classes."""

    def __init__(self, strip_section_classes=None, strip_plain_section=False):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip_depth = 0
        self.section_skip_stack = []  # depth counters for skipped sections
        self.strip_classes = strip_section_classes or set()
        self.strip_plain_section = strip_plain_section

    def handle_starttag(self, tag, attrs):
        if self.skip_depth:
            if tag in STRIP_TAGS:
                self.skip_depth += 1
            return
        if tag in STRIP_TAGS:
            self.skip_depth = 1
            return
        if tag == "section":
            cls = dict(attrs).get("class", "")
            classes = set(cls.split())
            plain = self.strip_plain_section and classes and \
                classes <= {"section", "section-gray", "section-black", "section-commercial"} and \
                "section" in classes
            if classes & self.strip_classes or plain:
                self.section_skip_stack.append(1)
                return
        if self.section_skip_stack:
            if tag == "section":
                self.section_skip_stack[-1] += 1

    def handle_endtag(self, tag):
        if self.skip_depth:
            if tag in STRIP_TAGS:
                self.skip_depth -= 1
            return
        if self.section_skip_stack and tag == "section":
            self.section_skip_stack[-1] -= 1
            if self.section_skip_stack[-1] == 0:
                self.section_skip_stack.pop()

    def handle_data(self, data):
        if not self.skip_depth and not self.section_skip_stack:
            self.parts.append(data)

    def text(self):
        return re.sub(r"\s+", " ", " ".join(self.parts)).strip()


OUR_STRIP_SECTIONS = {"v2-trust", "v2-services", "v2-nearby", "v2-final", "bottom-cta"}


def extract_competitor_text(html):
    p = TextExtractor()
    p.feed(html)
    return p.text()


def extract_our_text(html):
    # v2 city pillar: also drop the county-coverage link grid (bare .section)
    is_v2 = 'class="v2-hero' in html
    p = TextExtractor(strip_section_classes=set(OUR_STRIP_SECTIONS),
                      strip_plain_section=is_v2)
    p.feed(html)
    return p.text()


def fetch(url, dest: Path):
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Accept-Language": "en-US,en;q=0.9"})
    with urllib.request.urlopen(req, timeout=45) as r:
        body = r.read()
    dest.write_bytes(body)
    return body.decode("utf-8", errors="replace")


def top_terms(vec_row, feature_names, n=25):
    arr = vec_row.toarray().ravel()
    idx = arr.argsort()[::-1]
    return [(feature_names[i], round(float(arr[i]), 4)) for i in idx[:n] if arr[i] > 0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--json", help="write machine-readable results here")
    args = ap.parse_args()

    cfg = json.loads(Path(args.config).read_text(encoding="utf-8"))
    band_lo, band_hi = cfg.get("band", [0.40, 0.55])
    cache = Path(cfg["cache_dir"])
    cache.mkdir(parents=True, exist_ok=True)

    comp_docs, comp_meta = [], []
    for c in cfg["competitors"]:
        f = cache / (c["name"] + ".html")
        if f.exists():
            html = f.read_text(encoding="utf-8", errors="replace")
            src = "cache"
        else:
            try:
                html = fetch(c["url"], f)
                src = "fetched"
            except Exception as e:
                print(f"  !! {c['name']}: fetch FAILED ({e}) — excluded from corpus")
                comp_meta.append({"name": c["name"], "status": f"FAILED: {e}", "words": 0})
                continue
        text = extract_competitor_text(html)
        words = len(text.split())
        comp_meta.append({"name": c["name"], "status": src, "words": words})
        if words < 50:
            print(f"  !! {c['name']}: only {words} words after stripping — excluded")
            comp_meta[-1]["status"] += " (too thin, excluded)"
            continue
        comp_docs.append(text)
        print(f"  ok {c['name']}: {words} words ({src})")

    if len(comp_docs) < 3:
        sys.exit(f"FATAL: only {len(comp_docs)} usable competitor docs — corpus too thin.")

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=2000,
                                 stop_words="english")
    vectorizer.fit(comp_docs)
    feats = vectorizer.get_feature_names_out()
    corpus_vec = vectorizer.transform([" ".join(comp_docs)])

    results = []
    for pg in cfg["pages"]:
        html = Path(pg["path"]).read_text(encoding="utf-8", errors="replace")
        text = extract_our_text(html)
        page_vec = vectorizer.transform([text])
        score = float(cosine_similarity(page_vec, corpus_vec)[0][0])
        verdict = ("in band" if band_lo <= score <= band_hi
                   else "BELOW" if score < band_lo else "ABOVE")

        # diagnosis material
        c_arr = corpus_vec.toarray().ravel()
        p_arr = page_vec.toarray().ravel()
        missing = [(feats[i], round(float(c_arr[i]), 4))
                   for i in c_arr.argsort()[::-1]
                   if c_arr[i] > 0 and p_arr[i] == 0][:20]
        weak = [(feats[i], round(float(c_arr[i]), 4), round(float(p_arr[i]), 4))
                for i in c_arr.argsort()[::-1]
                if c_arr[i] > 0.03 and 0 < p_arr[i] < c_arr[i] * 0.25][:15]
        over = [(feats[i], round(float(p_arr[i]), 4), round(float(c_arr[i]), 4))
                for i in p_arr.argsort()[::-1]
                if p_arr[i] > 0.05 and p_arr[i] > c_arr[i] * 3][:15]

        results.append({"slug": pg["slug"], "score": round(score, 3),
                        "verdict": verdict, "words": len(text.split()),
                        "missing_terms": missing, "weak_terms": weak,
                        "overused_terms": over})
        print(f"  {pg['slug']:24s} {score:.3f}  {verdict}  ({len(text.split())} authored words)")

    out = {"market": cfg["market"], "band": [band_lo, band_hi],
           "competitors": comp_meta, "results": results,
           "sklearn_params": "ngram(1,2) max_features=2000 stop_words=english",
           }
    if args.json:
        Path(args.json).write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(f"JSON -> {args.json}")


if __name__ == "__main__":
    main()
