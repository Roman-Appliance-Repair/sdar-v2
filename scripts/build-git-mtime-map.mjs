// Generates scripts/git-mtime-map.json — a snapshot of per-file last-commit
// dates used by astro.config.mjs to emit accurate <lastmod> in sitemap-0.xml.
//
// Runs as `prebuild` so local `npm run build` always refreshes the map.
// On Cloudflare Pages (shallow git clone, ~1 commit visible), refuses to
// overwrite — the committed JSON is preserved and read by the build.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'git-mtime-map.json');
const SHALLOW_THRESHOLD = 50;

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 });
}

let commitCount = 0;
try {
  commitCount = parseInt(run('git rev-list --count HEAD').trim(), 10) || 0;
} catch (e) {
  console.warn('[mtime-map] git not available; preserving existing JSON');
  process.exit(0);
}

if (commitCount < SHALLOW_THRESHOLD) {
  console.warn(`[mtime-map] shallow clone detected (${commitCount} commits, threshold ${SHALLOW_THRESHOLD}) — preserving committed JSON`);
  process.exit(0);
}

let out;
try {
  out = run('git log --name-only --pretty=format:__SDAR_DATE__%cI');
} catch (e) {
  console.warn('[mtime-map] git log failed; preserving existing JSON:', e.message);
  process.exit(0);
}

const map = {};
let currentDate = null;
for (const line of out.split('\n')) {
  if (line.startsWith('__SDAR_DATE__')) {
    currentDate = line.slice('__SDAR_DATE__'.length);
  } else if (line && currentDate && !(line in map)) {
    map[line] = currentDate;
  }
}

const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
const json = JSON.stringify(sorted, null, 2) + '\n';

let existing = null;
try { existing = fs.readFileSync(OUT, 'utf8'); } catch {}

if (existing === json) {
  console.log(`[mtime-map] up to date: ${Object.keys(sorted).length} files (${commitCount} commits)`);
} else {
  fs.writeFileSync(OUT, json);
  console.log(`[mtime-map] wrote ${Object.keys(sorted).length} files from ${commitCount} commits → scripts/git-mtime-map.json`);
}
