import { readFile, writeFile } from 'node:fs/promises';
import { STATE_FILES } from './paths.js';
import { stddev } from './format.js';

const WINDOW_DAYS = 30;

async function load() {
  const raw = await readFile(STATE_FILES.baseline, 'utf8');
  return JSON.parse(raw);
}

async function persist(data) {
  await writeFile(STATE_FILES.baseline, JSON.stringify(data, null, 2), 'utf8');
}

export async function getBaseline() {
  return load();
}

export async function appendSnapshot(snapshot) {
  if (!snapshot.date) throw new Error('snapshot.date required');
  const data = await load();
  const existing = data.snapshots.findIndex((s) => s.date === snapshot.date);
  if (existing >= 0) {
    data.snapshots[existing] = snapshot;
  } else {
    data.snapshots.push(snapshot);
  }
  data.snapshots.sort((a, b) => a.date.localeCompare(b.date));
  if (data.snapshots.length > WINDOW_DAYS + 5) {
    data.snapshots = data.snapshots.slice(-WINDOW_DAYS);
  }
  data.lastUpdated = new Date().toISOString();
  await persist(data);
  return data;
}

function pickRange(snapshots, days, endDateIso) {
  const end = new Date(endDateIso);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return snapshots.filter((s) => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });
}

export function summarize(snapshots, key) {
  const values = snapshots
    .map((s) => s.metrics?.[key])
    .filter((v) => v !== null && v !== undefined && Number.isFinite(v));
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  return { sum, mean, count: values.length, stddev: stddev(values), values };
}

export function compareWindows(baseline, key, endDateIso) {
  const snapshots = baseline.snapshots || [];
  const last7 = pickRange(snapshots, 7, endDateIso);
  const last28 = pickRange(snapshots, 28, endDateIso);
  return {
    avg7: summarize(last7, key),
    avg28: summarize(last28, key),
    samplesAvailable: snapshots.length,
  };
}

export function isAnomaly(currentValue, summaryStats, sigmaThreshold = 2) {
  if (!summaryStats || summaryStats.count < 3) return false;
  const z = Math.abs((currentValue - summaryStats.mean) / (summaryStats.stddev || 1));
  return z >= sigmaThreshold;
}
