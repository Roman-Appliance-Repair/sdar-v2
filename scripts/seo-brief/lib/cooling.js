import { readFile, writeFile } from 'node:fs/promises';
import { STATE_FILES } from './paths.js';
import { daysBetween } from './project-state.js';

async function load() {
  const raw = await readFile(STATE_FILES.cooling, 'utf8');
  return JSON.parse(raw);
}

async function persist(data) {
  await writeFile(STATE_FILES.cooling, JSON.stringify(data, null, 2), 'utf8');
}

export async function getCooling() {
  return load();
}

export async function isPageInCooling(pagePath, today = new Date()) {
  const data = await load();
  const todayIso = today.toISOString().slice(0, 10);
  const entry = data.pages.find((p) => p.path === pagePath);
  if (!entry) return { cooling: false };
  if (entry.status === 'active') return { cooling: true, reason: 'active development', entry };
  if (entry.deployedAt) {
    const days = daysBetween(entry.deployedAt, todayIso);
    const window = entry.coolingDays ?? data.defaultCoolingDays;
    if (days < window) {
      return { cooling: true, reason: `within ${window}-day cooling (deployed ${days}d ago)`, entry };
    }
  }
  return { cooling: false, entry };
}

export async function markDeployed(pagePath, today = new Date(), coolingDays) {
  const data = await load();
  const iso = today.toISOString().slice(0, 10);
  const idx = data.pages.findIndex((p) => p.path === pagePath);
  const entry = { path: pagePath, deployedAt: iso, status: 'cooling' };
  if (coolingDays) entry.coolingDays = coolingDays;
  if (idx >= 0) data.pages[idx] = { ...data.pages[idx], ...entry };
  else data.pages.push(entry);
  await persist(data);
}
