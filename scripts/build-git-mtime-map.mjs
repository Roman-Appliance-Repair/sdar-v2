// Generates scripts/git-mtime-map.json — per-file last-commit dates for the page
// sources under src/pages/, read by astro.config.mjs to emit <lastmod> in
// sitemap-0.xml.
//
// THE FILE IS COMMITTED. Cloudflare Pages builds from a shallow clone: there
// `git log` sees one commit, and every file's "last commit" is the deploy
// commit — that is exactly how all 1160 sitemap URLs ended up with the same
// <lastmod>. So:
//   - locally (full history) `npm run build` runs this as `prebuild` and
//     refreshes the JSON; commit it together with your changes;
//   - in a shallow clone (Cloudflare) it first tries `git fetch --unshallow`;
//     if that fails it leaves the committed JSON untouched and the build reads it.
// A page changed in the commit you are about to make carries its previous
// commit date until the map is regenerated after that commit (one-commit lag).

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'git-mtime-map.json');
const PREFIX = 'src/pages/';

function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 200 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    ...opts,
  });
}

function isShallow() {
  return run('git rev-parse --is-shallow-repository').trim() === 'true';
}

try {
  run('git rev-parse --git-dir');
} catch {
  console.warn('[mtime-map] git not available; using committed scripts/git-mtime-map.json');
  process.exit(0);
}

if (isShallow()) {
  try {
    run('git fetch --unshallow --quiet', { timeout: 90_000, stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('[mtime-map] shallow clone: fetched full history');
  } catch {
    console.warn('[mtime-map] shallow clone and unshallow failed — using committed scripts/git-mtime-map.json');
    process.exit(0);
  }
  if (isShallow()) {
    console.warn('[mtime-map] still shallow — using committed scripts/git-mtime-map.json');
    process.exit(0);
  }
}

let out;
try {
  out = run(`git log --name-only --pretty=format:__SDAR_DATE__%cI -- ${PREFIX}`);
} catch (e) {
  console.warn('[mtime-map] git log failed; using committed JSON:', e.message);
  process.exit(0);
}

const map = {};
let currentDate = null;
for (const line of out.split('\n')) {
  if (line.startsWith('__SDAR_DATE__')) {
    currentDate = line.slice('__SDAR_DATE__'.length);
  } else if (line && currentDate && line.startsWith(PREFIX) && !(line in map)) {
    // Only files that still exist: deleted pages have no URL to date.
    if (fs.existsSync(path.join(ROOT, line))) map[line] = currentDate;
  }
}

const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
const json = JSON.stringify(sorted, null, 2) + '\n';

let existing = null;
try { existing = fs.readFileSync(OUT, 'utf8'); } catch {}

if (existing === json) {
  console.log(`[mtime-map] up to date: ${Object.keys(sorted).length} page files`);
} else {
  fs.writeFileSync(OUT, json);
  console.log(`[mtime-map] wrote ${Object.keys(sorted).length} page files → scripts/git-mtime-map.json (commit it)`);
}
