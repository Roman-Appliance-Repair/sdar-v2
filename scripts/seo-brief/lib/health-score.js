// Composite health score 0-100. Three sub-scores with weights:
//   - indexationHealth (40%) — actual indexed pct vs expected for current day
//   - searchHealth     (35%) — clicks trend + CTR vs benchmark + avg position direction
//   - behaviorHealth   (25%) — engagement rate + session/user trend
//
// During the first 28 days post-cutover the score is capped at 75 (we mark it as
// "settling") because real comparisons aren't meaningful yet.

export function indexationHealth({ indexedPct, expectedPct }) {
  if (indexedPct === null || indexedPct === undefined) return null;
  if (expectedPct === null || expectedPct === undefined) {
    return Math.max(0, Math.min(100, indexedPct));
  }
  const ratio = indexedPct / Math.max(1, expectedPct);
  if (ratio >= 1) return 100;
  if (ratio >= 0.85) return 80 + (ratio - 0.85) * (20 / 0.15);
  if (ratio >= 0.7) return 60 + (ratio - 0.7) * (20 / 0.15);
  return Math.max(0, ratio * (60 / 0.7));
}

export function searchHealth({ clicksTrend, ctrVsBenchmark, positionTrend }) {
  let score = 50;
  if (clicksTrend !== null && clicksTrend !== undefined) {
    score += Math.max(-20, Math.min(20, clicksTrend * 100));
  }
  if (ctrVsBenchmark !== null && ctrVsBenchmark !== undefined) {
    score += Math.max(-15, Math.min(20, (ctrVsBenchmark - 1) * 30));
  }
  if (positionTrend !== null && positionTrend !== undefined) {
    score += Math.max(-15, Math.min(15, -positionTrend * 5));
  }
  return Math.max(0, Math.min(100, score));
}

export function behaviorHealth({ engagementRate, sessionsTrend }) {
  let score = 50;
  if (engagementRate !== null && engagementRate !== undefined) {
    score += Math.max(-20, Math.min(30, (engagementRate - 0.45) * 100));
  }
  if (sessionsTrend !== null && sessionsTrend !== undefined) {
    score += Math.max(-15, Math.min(20, sessionsTrend * 100));
  }
  return Math.max(0, Math.min(100, score));
}

export function compositeHealth({ indexation, search, behavior, settling }) {
  const parts = [];
  let weightSum = 0;
  if (indexation !== null && indexation !== undefined) { parts.push([indexation, 0.40]); weightSum += 0.40; }
  if (search !== null && search !== undefined) { parts.push([search, 0.35]); weightSum += 0.35; }
  if (behavior !== null && behavior !== undefined) { parts.push([behavior, 0.25]); weightSum += 0.25; }
  if (parts.length === 0) return null;
  const score = parts.reduce((acc, [v, w]) => acc + v * w, 0) / weightSum;
  if (settling) return Math.min(score, 75);
  return Math.round(score);
}

export function scoreLabel(score) {
  if (score === null || score === undefined) return 'n/a';
  if (score >= 85) return 'strong';
  if (score >= 70) return 'healthy';
  if (score >= 55) return 'mixed';
  if (score >= 40) return 'attention';
  return 'critical';
}
