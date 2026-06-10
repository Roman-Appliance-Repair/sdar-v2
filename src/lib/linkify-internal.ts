/**
 * Phase B-1 internal linkifier (render-time, prose-only).
 *
 * Extends the proven `linkify-brands` engine to a brand + city dictionary and
 * adds PAGE-LEVEL link budgeting. Wraps the first natural mention of each known
 * brand / city in a contextual `<a href="…">`, within the LOCKED rules:
 *
 *   dictionary = BRAND_PILLAR_MAP (55, /brands/{slug}/) + CITY_LINK_MAP (84, /{slug}/)
 *   per-page cap 4 · sub-caps brand ≤3, city ≤1 · priority brand → city (via sub-caps)
 *   first-occurrence · 1 link per target per page · no self-link · no primary-keyword
 *   (term whose slug is a segment of the page URL) · min ~8 words between links
 *
 * SAFETY (inherited from linkify-brands):
 *  - tag-aware: passes HTML tags through verbatim, links only text between tags,
 *    NEVER links inside an existing `<a>…</a>` (no nested anchors).
 *  - Intended for prose props rendered via `set:html` (intro/narrative/context/
 *    recent-repairs). NOT wired into eyebrow / service-area lists / FAQ / nav /
 *    headings / JSON-LD — those simply never call this function.
 *
 * PAGE BUDGET: callers pass the current page path (`Astro.url.pathname`). A
 * module-level Map keyed by that path shares one budget across every prose
 * component on the same page, so the cap is per-PAGE, not per-call. Astro SSG
 * renders each page in a single worker, and every page path is unique, so the
 * keyed budget is collision-free across the build.
 *
 * Targets are pre-vetted (city-link-map.ts excludes redirecting/ambiguous; the
 * brand map is already curated) — 0 redirect/404 destinations.
 */

import { BRAND_PILLAR_MAP } from '../data/brand-pillar-map';
import { CITY_LINK_MAP } from '../data/city-link-map';

type Kind = 'brand' | 'city';
const DICT = new Map<string, { url: string; kind: Kind }>();
for (const [disp, slug] of Object.entries(BRAND_PILLAR_MAP)) {
  DICT.set(disp, { url: `/brands/${slug}/`, kind: 'brand' });
}
for (const [disp, slug] of Object.entries(CITY_LINK_MAP)) {
  if (!DICT.has(disp)) DICT.set(disp, { url: `/${slug}/`, kind: 'city' });
}

const BRAND_URLS = new Set(Object.values(BRAND_PILLAR_MAP).map((s) => `/brands/${s}/`));
const CITY_URLS = new Set(Object.values(CITY_LINK_MAP).map((s) => `/${s}/`));

const SORTED = Array.from(DICT.keys()).sort((a, b) => b.length - a.length);
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const TERM_RE = new RegExp(
  '(?<![A-Za-z0-9])(' + SORTED.map(escapeRegExp).join('|') + ')(?![A-Za-z0-9])',
  'g',
);

const CAP = 4;
const SUBCAP: Record<Kind, number> = { brand: 3, city: 1 };
const MIN_WORDS = 8;

/** Per-render link budget. MUST be created once per component/template render and
 *  threaded into every linkifyInternal call in that render — this is an EXPLICIT
 *  local object (NOT module state), so the cap accumulates reliably across the
 *  synchronous render even though Astro does not share module-level mutable state. */
export interface LinkBudget {
  url: string;
  segs: Set<string>;
  brand: number;
  city: number;
  total: number;
  linked: Set<string>;
}

function normUrl(u: string): string {
  if (!u) return '/';
  const q = u.indexOf('?'); if (q !== -1) u = u.slice(0, q);
  const h = u.indexOf('#'); if (h !== -1) u = u.slice(0, h);
  if (u !== '/' && !u.endsWith('/')) u += '/';
  return u;
}

export function newLinkBudget(pageUrl: string): LinkBudget {
  const url = normUrl(pageUrl);
  return { url, segs: new Set(url.split('/').filter(Boolean)), brand: 0, city: 0, total: 0, linked: new Set() };
}

function slugOf(url: string): string {
  const parts = url.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

function linkifySegment(text: string, ctx: LinkBudget): string {
  let out = '';
  let last = 0;
  let lastLinkWord = -MIN_WORDS;
  TERM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TERM_RE.exec(text)) !== null) {
    const term = m[1];
    const entry = DICT.get(term);
    out += text.slice(last, m.index);
    last = m.index + term.length;
    if (!entry) { out += term; continue; }
    const { url, kind } = entry;
    const wordIdx = text.slice(0, m.index).split(/\s+/).length;
    const can =
      ctx.total < CAP &&
      url !== ctx.url &&
      !ctx.segs.has(slugOf(url)) &&
      !ctx.linked.has(url) &&
      ctx[kind] < SUBCAP[kind] &&
      (wordIdx - lastLinkWord) >= MIN_WORDS;
    if (can) {
      out += `<a href="${url}">${term}</a>`;
      ctx.linked.add(url);
      ctx[kind] += 1;
      ctx.total += 1;
      lastLinkWord = wordIdx;
    } else {
      out += term;
    }
  }
  out += text.slice(last);
  return out;
}

/** Linkify a prose string against a per-render LinkBudget (see newLinkBudget). */
export function linkifyInternal(text: string | null | undefined, ctx: LinkBudget): string {
  if (!text) return '';
  // Count any PRE-EXISTING dict links (author-authored) toward the page budget so
  // the total prose links stay within the cap (don't double the count on top of
  // hand-written links).
  if (text.indexOf('<a') !== -1) {
    for (const m of text.matchAll(/<a\b[^>]*?href="([^"]+)"/gi)) {
      const href = m[1];
      if (ctx.linked.has(href)) continue;
      const kind: Kind | null = BRAND_URLS.has(href) ? 'brand' : CITY_URLS.has(href) ? 'city' : null;
      if (kind) { ctx.linked.add(href); ctx[kind] += 1; ctx.total += 1; }
    }
  }
  if (text.indexOf('<') === -1) return linkifySegment(text, ctx);
  // tag-aware walk: pass tags verbatim, never link inside an existing <a>…</a>
  let out = '';
  let i = 0;
  let inAnchor = 0;
  while (i < text.length) {
    if (text[i] === '<') {
      const end = text.indexOf('>', i);
      if (end === -1) { out += text.slice(i); break; }
      const tag = text.slice(i, end + 1);
      if (/^<a[\s>]/i.test(tag)) inAnchor++;
      else if (/^<\/a\s*>/i.test(tag)) inAnchor = Math.max(0, inAnchor - 1);
      out += tag;
      i = end + 1;
    } else {
      const next = text.indexOf('<', i);
      const chunk = next === -1 ? text.slice(i) : text.slice(i, next);
      out += inAnchor > 0 ? chunk : linkifySegment(chunk, ctx);
      i = next === -1 ? text.length : next;
    }
  }
  return out;
}
