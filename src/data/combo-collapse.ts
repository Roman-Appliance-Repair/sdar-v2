// 56 zero-demand city×service combos canonicalized to their city pillar /[city]/.
// Source: wiki/briefings/2026-07-02-residential-cluster-analytics.md — раздел
// "Аудит мёртвого хвоста", список A (Ahrefs объём = 0/мес, GSC-показы ≈ 0).
// Effect: the combo page still builds & serves (Maps/direct), but rel=canonical
// points Google to the city pillar instead of ranking it as a separate page.
// Reversible: remove a key (or empty the set) → page reverts to self-canonical.
//
// 2026-10-08 (city stage 1): EMPTY. A canonicalized duplicate still built and still
// took internal links, so the owner replaced the canonical with a real 301. Of the 56
// combos that were listed here, 54 are retired (no page, 301 to the city hub — see
// LIVE_COMBOS in city-service-matrix.ts) and 2 met the keep threshold and are
// self-canonical again: los-angeles/wall-oven-repair, burbank/wall-oven-repair.
// The set and isCollapsedCombo() stay so a future zero-demand combo can be parked
// here, but prefer retiring it in city-service-matrix.ts.

export const COLLAPSED_COMBOS = new Set<string>([]);

export function isCollapsedCombo(city: string, service: string): boolean {
  return COLLAPSED_COMBOS.has(`${city}/${service}`);
}
