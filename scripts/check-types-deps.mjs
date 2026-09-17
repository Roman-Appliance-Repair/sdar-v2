// Guard for `npm run verify:types`.
// Without @astrojs/check, `astro check` asks to install it and exits 0 when stdin is not
// interactive, so the gate looked green while nothing was type-checked (2026-09-16).
// This script fails the gate instead when a required package cannot be resolved.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED = ['@astrojs/check', 'typescript'];

// Plain file check: @astrojs/check's "exports" map hides package.json from require.resolve.
const missing = REQUIRED.filter(
  (name) => !existsSync(join(process.cwd(), 'node_modules', ...name.split('/'), 'package.json')),
);

if (missing.length) {
  console.error(`verify:types: FAIL, not installed: ${missing.join(', ')}. Run \`npm ci\` and retry.`);
  process.exit(1);
}
console.log(`verify:types: deps ok (${REQUIRED.join(', ')})`);
