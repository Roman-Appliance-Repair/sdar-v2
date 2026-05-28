/**
 * Wave 69 Phase A — first-mention brand linkifier (render-time only).
 *
 * Takes a string and wraps the FIRST occurrence of each known brand display
 * name (per `BRAND_PILLAR_MAP`) in `<a href="/brands/{slug}/">…</a>`.
 * Subsequent mentions of the same brand in the same string stay plain text
 * to avoid over-linking (a single answer/cell shouldn't pillar-link the same
 * brand 3-4×).
 *
 * Handles two input shapes:
 *  - Pure plain text (no `<` chars) — common for PricingCards `appliance`/
 *    `note` fields and most FAQ answers. Linkifies in place.
 *  - Strings containing inline HTML markup (e.g. `<strong>$89</strong>` or an
 *    existing `<a>…</a>`). Walks tag-aware: passes tags through verbatim,
 *    linkifies only text between tags, and skips text inside an existing
 *    `<a>…</a>` so we never produce nested anchors.
 *
 * Matching is word-boundary aware via `(?<![A-Za-z0-9])…(?![A-Za-z0-9])`,
 * so "LG" inside "LGBT" or "Bosch" inside "Boschat" won't match. Display
 * variants are tried longest-first so "Sub-Zero" beats "Sub" (not in map
 * anyway) and "GE Monogram" beats "GE".
 *
 * Output is intended to be rendered via Astro `set:html={…}` (no further
 * escaping — input is treated as the existing render contract: FAQ answers
 * already flow through `set:html` and PricingCards data is hand-authored
 * plain text without raw `<`/`>` chars).
 */

import { BRAND_PILLAR_MAP } from '../data/brand-pillar-map';

const SORTED_DISPLAYS = Object.keys(BRAND_PILLAR_MAP).sort(
  (a, b) => b.length - a.length,
);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const BRAND_RE = new RegExp(
  '(?<![A-Za-z0-9])(' + SORTED_DISPLAYS.map(escapeRegExp).join('|') + ')(?![A-Za-z0-9])',
  'g',
);

function linkifyPlainSegment(text: string, linkedSlugs: Set<string>): string {
  let out = '';
  let lastIndex = 0;
  BRAND_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BRAND_RE.exec(text)) !== null) {
    const matched = m[1];
    const slug = BRAND_PILLAR_MAP[matched];
    out += text.slice(lastIndex, m.index);
    if (slug && !linkedSlugs.has(slug)) {
      linkedSlugs.add(slug);
      out += `<a href="/brands/${slug}/">${matched}</a>`;
    } else {
      out += matched;
    }
    lastIndex = m.index + matched.length;
  }
  out += text.slice(lastIndex);
  return out;
}

export function linkifyBrands(text: string | null | undefined): string {
  if (!text) return '';
  const linkedSlugs = new Set<string>();
  if (text.indexOf('<') === -1) {
    return linkifyPlainSegment(text, linkedSlugs);
  }
  let out = '';
  let i = 0;
  let inAnchor = 0;
  while (i < text.length) {
    if (text[i] === '<') {
      const end = text.indexOf('>', i);
      if (end === -1) {
        out += text.slice(i);
        break;
      }
      const tag = text.slice(i, end + 1);
      if (/^<a[\s>]/i.test(tag)) inAnchor++;
      else if (/^<\/a\s*>/i.test(tag)) inAnchor = Math.max(0, inAnchor - 1);
      out += tag;
      i = end + 1;
    } else {
      const next = text.indexOf('<', i);
      const chunk = next === -1 ? text.slice(i) : text.slice(i, next);
      out += inAnchor > 0 ? chunk : linkifyPlainSegment(chunk, linkedSlugs);
      i = next === -1 ? text.length : next;
    }
  }
  return out;
}
