// 56 zero-demand city×service combos canonicalized to their city pillar /[city]/.
// Source: wiki/briefings/2026-07-02-residential-cluster-analytics.md — раздел
// "Аудит мёртвого хвоста", список A (Ahrefs объём = 0/мес, GSC-показы ≈ 0).
// Effect: the combo page still builds & serves (Maps/direct), but rel=canonical
// points Google to the city pillar instead of ranking it as a separate page.
// Reversible: remove a key (or empty the set) → page reverts to self-canonical.

export const COLLAPSED_COMBOS = new Set<string>([
  "anaheim/ice-maker-repair",
  "anaheim/microwave-repair",
  "anaheim/wall-oven-repair",
  "beverly-hills/freezer-repair",
  "beverly-hills/ice-maker-repair",
  "beverly-hills/range-repair",
  "beverly-hills/stove-repair",
  "beverly-hills/wall-oven-repair",
  "burbank/freezer-repair",
  "burbank/ice-maker-repair",
  "burbank/microwave-repair",
  "burbank/range-repair",
  "burbank/wall-oven-repair",
  "glendale/freezer-repair",
  "glendale/ice-maker-repair",
  "glendale/microwave-repair",
  "glendale/range-repair",
  "glendale/wall-oven-repair",
  "hollywood/oven-repair",
  "irvine/microwave-repair",
  "irvine/wall-oven-repair",
  "long-beach/cooktop-repair",
  "long-beach/freezer-repair",
  "long-beach/ice-maker-repair",
  "long-beach/microwave-repair",
  "long-beach/oven-repair",
  "long-beach/range-repair",
  "long-beach/stove-repair",
  "long-beach/wall-oven-repair",
  "los-angeles/cooktop-repair",
  "los-angeles/wall-oven-repair",
  "pasadena/microwave-repair",
  "pasadena/wall-oven-repair",
  "rancho-cucamonga/microwave-repair",
  "rancho-cucamonga/wall-oven-repair",
  "santa-monica/cooktop-repair",
  "santa-monica/dryer-repair",
  "santa-monica/freezer-repair",
  "santa-monica/ice-maker-repair",
  "santa-monica/microwave-repair",
  "santa-monica/oven-repair",
  "santa-monica/range-repair",
  "santa-monica/wall-oven-repair",
  "santa-monica/washer-repair",
  "temecula/microwave-repair",
  "temecula/wall-oven-repair",
  "thousand-oaks/cooktop-repair",
  "thousand-oaks/freezer-repair",
  "thousand-oaks/ice-maker-repair",
  "thousand-oaks/microwave-repair",
  "thousand-oaks/range-repair",
  "thousand-oaks/stove-repair",
  "thousand-oaks/wall-oven-repair",
  "west-hollywood/ice-maker-repair",
  "west-hollywood/stove-repair",
  "west-hollywood/wall-oven-repair",
]);

export function isCollapsedCombo(city: string, service: string): boolean {
  return COLLAPSED_COMBOS.has(`${city}/${service}`);
}
