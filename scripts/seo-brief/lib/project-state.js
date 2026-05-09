import { readFile } from 'node:fs/promises';
import { STATE_FILES } from './paths.js';

let cached = null;

export async function loadProjectState() {
  if (cached) return cached;
  const raw = await readFile(STATE_FILES.projectState, 'utf8');
  cached = JSON.parse(raw);
  return cached;
}

export function daysBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / 86_400_000);
}

export function lastEventOfType(state, type) {
  return [...state.events].reverse().find((e) => e.type === type) || null;
}

export function suppressionContext(state, today = new Date()) {
  const todayIso = today.toISOString().slice(0, 10);
  const cutover = lastEventOfType(state, 'dns_cutover');
  const schemaSweep = lastEventOfType(state, 'schema_sweep');
  const daysSinceCutover = cutover ? daysBetween(cutover.date, todayIso) : null;
  const daysSinceSchema = schemaSweep ? daysBetween(schemaSweep.date, todayIso) : null;
  const photosMissing = state.ongoing?.photos_missing === true;

  return {
    daysSinceCutover,
    daysSinceSchema,
    photosMissing,
    baselineStillBuilding: cutover && daysSinceCutover < 28,
    schemaImpactSettling: schemaSweep && daysSinceSchema < 14,
    suppressCtrRecommendations: photosMissing,
    suppressEngagementRecommendations: photosMissing,
    suppressSchemaRecommendations: schemaSweep && daysSinceSchema < 14,
    suppressStructuralRecommendations: cutover && daysSinceCutover < 28,
  };
}

export function denylistedPagePath(state, path) {
  const list = state.denylist?.local_pack_suppressed_pages || [];
  return list.includes(path);
}

export function denylistedQueryPattern(state, query) {
  const patterns = state.denylist?.local_pack_suppressed_query_patterns || [];
  const lower = query.toLowerCase();
  return patterns.some((p) => {
    if (p.includes('{brand}')) {
      return /^[a-z\-]+ repair$/.test(lower) && lower.length < 30;
    }
    return lower.includes(p.toLowerCase());
  });
}

export function indexationExpectedToday(state, today = new Date()) {
  const todayIso = today.toISOString().slice(0, 10);
  const points = state.expectations?.indexation_timeline || [];
  if (points.length === 0) return null;
  const cutover = lastEventOfType(state, 'dns_cutover');
  if (!cutover) return null;
  const cutoverDate = cutover.date;
  for (let i = 0; i < points.length; i += 1) {
    if (todayIso <= points[i].by) {
      const prev = i === 0
        ? { by: cutoverDate, target_pct: 0 }
        : points[i - 1];
      const totalDays = daysBetween(prev.by, points[i].by);
      const elapsed = daysBetween(prev.by, todayIso);
      const frac = totalDays === 0 ? 1 : Math.max(0, Math.min(1, elapsed / totalDays));
      const interp = prev.target_pct + (points[i].target_pct - prev.target_pct) * frac;
      return Math.round(interp);
    }
  }
  return points[points.length - 1].target_pct;
}
