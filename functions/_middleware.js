/**
 * Root middleware — strips utm_* tracking params via 301 redirect.
 *
 * Why: GMB profile links carry ?utm_source=gmb&utm_medium=organic&utm_campaign=…
 * Google indexed those UTM URLs as separate pages (GSC shows /west-hollywood/?utm_…
 * with 800+ impressions/week), splitting ranking signals with the clean URLs
 * despite correct rel=canonical. A 301 is a directive, not a hint — next crawl
 * consolidates the UTM variants into the clean URLs permanently.
 *
 * Scope guards:
 *   - GET/HEAD only (won't break /api/* POST endpoints)
 *   - /api/* paths excluded entirely
 *   - only utm_* params are stripped; any other query params survive
 */

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'GET' || request.method === 'HEAD') {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      const utmKeys = [...url.searchParams.keys()].filter((k) =>
        k.toLowerCase().startsWith('utm_')
      );

      if (utmKeys.length > 0) {
        for (const key of utmKeys) {
          url.searchParams.delete(key);
        }
        return Response.redirect(url.toString(), 301);
      }
    }
  }

  return context.next();
}
