// src/lib/article-schema.ts
//
// Article JSON-LD for informational guide pages (list: src/data/article-pages.ts).
// Emitted once per page by Layout.astro, next to the page's own FAQPage /
// BreadcrumbList / LocalBusiness blocks (nodes are linked by @id, not duplicated).
//
// Every field comes from something real:
//   headline / description — the page's own <title> and meta description;
//   image                 — the page's hero (public/images/<path>/hero.jpg) when the
//                           file exists, else the site og-image;
//   datePublished         — first git commit of the page source (scripts/git-ctime-map.json);
//   dateModified          — last git commit of the page source (scripts/git-mtime-map.json);
//   author                — Roman Abysov, the owner (Person node lives on /about/);
//   publisher             — the #organization entity (src/lib/organization-schema.ts).
// Both date maps are committed and refreshed by `npm run build` (prebuild).

import fs from 'node:fs';
import path from 'node:path';
import { ORG_PUBLISHER, SITE_URL } from './organization-schema';

const ROOT = process.cwd();

function readMap(file: string): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', file), 'utf8'));
  } catch {
    return {};
  }
}

const MODIFIED = readMap('git-mtime-map.json');
const CREATED = readMap('git-ctime-map.json');

/** Author of the guides: the owner. Same @id as the Person node on /about/. */
export const AUTHOR_PERSON = {
  '@type': 'Person',
  '@id': `${SITE_URL}/about/#roman`,
  name: 'Roman Abysov',
  jobTitle: 'Owner',
  url: `${SITE_URL}/about/`
} as const;

/** src/pages file behind a static route, e.g. /services/x/y/ → src/pages/services/x/y.astro */
function sourceFileFor(pathname: string): string | null {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  for (const rel of [`src/pages/${clean}.astro`, `src/pages/${clean}/index.astro`]) {
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }
  return null;
}

export function heroImageFor(pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const rel = `images/${clean}/hero.jpg`;
  return fs.existsSync(path.join(ROOT, 'public', rel)) ? `${SITE_URL}/${rel}` : `${SITE_URL}/og-image.png`;
}

export interface PageDates {
  datePublished?: string;
  dateModified?: string;
}

export function pageDates(pathname: string): PageDates {
  const src = sourceFileFor(pathname);
  if (!src) return {};
  const dateModified = MODIFIED[src];
  const datePublished = CREATED[src] ?? dateModified;
  return {
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {})
  };
}

export function buildArticleSchema(opts: {
  pathname: string;
  canonical: string;
  headline: string;
  description: string;
}): Record<string, unknown> {
  const { pathname, canonical, headline, description } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline,
    description,
    image: heroImageFor(pathname),
    ...pageDates(pathname),
    author: AUTHOR_PERSON,
    publisher: ORG_PUBLISHER,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: 'en-US'
  };
}
