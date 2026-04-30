#!/usr/bin/env node
/**
 * sweep-streetaddress-removal.mjs
 *
 * Removes `address: { ... PostalAddress ... }` blocks from JSON-LD
 * schemas across non-physical_pin pages per NAP/Rating SSOT Rule 2
 * (wiki/decisions/nap-rating-policy-ssot.md).
 *
 * Per Rule 2: streetAddress and the wrapping PostalAddress block are
 * permitted ONLY on the physical_pin business entity (West Hollywood).
 * All other service-area pages (county hubs, luxury combos, credentials,
 * for-business, price-list, maintenance) must omit address entirely;
 * only `areaServed` is permitted.
 *
 * Skip list (intentionally NOT modified):
 *   - src/pages/west-hollywood.astro      (physical_pin — full address allowed)
 *   - src/components/homepage/HomepageSchema.astro  (already gates on branch.type)
 *   - src/pages/book.astro                (corporate form — Organization-level address)
 *   - src/pages/contact.astro             (corporate form — Organization-level address)
 *   - src/components/Footer.astro         (visible NAP for B2B contact context)
 *
 * Modes:
 *   --dry-run (default): logs counts to audit-output/sweep-streetaddress-dryrun.log
 *   --apply: writes changes to disk
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const isApply = process.argv.includes('--apply');
const PAGES_DIR = 'src/pages';

const SKIP = new Set([
  'src/pages/west-hollywood.astro',
  'src/pages/book.astro',
  'src/pages/contact.astro',
]);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) yield full;
  }
}

/**
 * Remove the `address: { @type: 'PostalAddress' ... }` block.
 *
 * Pattern handled (multi-line OR single-line):
 *   "address": { "@type": "PostalAddress", "streetAddress": "...", ... }
 *   address: { "@type": "PostalAddress", streetAddress: "...", ... }
 *
 * The PostalAddress block contains only flat string fields (no nested
 * `{ }`), so single-pass regex with `[^{}]*` is safe.
 *
 * Removes the entire block + any preceding/trailing comma to keep the
 * parent JSON object valid.
 */
function removeAddressBlock(text) {
  let count = 0;

  // Match `"?address"?\s*:\s*\{` then everything (non-brace) up to first `}`.
  // The block must contain "PostalAddress" in its body to avoid removing
  // unrelated `address` properties.
  const re = /"?address"?\s*:\s*\{[^{}]*?PostalAddress[^{}]*\}\s*,?\n?/g;

  let out = text.replace(re, () => {
    count++;
    return '';
  });

  if (count === 0) return { text: out, count };

  // Cleanup: dangling comma before close brace (when address was the
  // last field in its parent object).
  out = out.replace(/,(\s*\n\s*})/g, '$1');
  out = out.replace(/,(\s*})/g, '$1');

  return { text: out, count };
}

function main() {
  const allFiles = [...walk(PAGES_DIR)];
  const filesChanged = [];
  let totalBlocks = 0;

  for (const f of allFiles) {
    const rel = f.replace(/\\/g, '/');
    if (SKIP.has(rel)) continue;
    if (!f.endsWith('.astro')) continue;

    const text = readFileSync(f, 'utf8');
    if (!text.includes('streetAddress')) continue;
    // Skip files where streetAddress only appears in comments
    if (!/^\s*"?streetAddress"?\s*:/m.test(text)) continue;

    const { text: out, count } = removeAddressBlock(text);
    if (count > 0 && out !== text) {
      filesChanged.push({ file: rel, count });
      totalBlocks += count;
      if (isApply) {
        writeFileSync(f, out, 'utf8');
      }
    }
  }

  // Report
  const lines = [];
  lines.push(`# streetAddress Sweep — ${isApply ? 'APPLIED' : 'DRY-RUN'}`);
  lines.push('');
  lines.push(`Files scanned: ${allFiles.length}`);
  lines.push(`Files with streetAddress in schema (excluding skip list): ${filesChanged.length}`);
  lines.push(`Total address blocks removed: ${totalBlocks}`);
  lines.push('');
  lines.push(`Skip list (NOT modified):`);
  for (const s of SKIP) lines.push(`  ${s}`);
  lines.push('');

  // Categorize
  const byCategory = {};
  for (const { file, count } of filesChanged) {
    const parts = file.split('/');
    const cat = parts[2] === undefined ? '(other)' :
                parts[2].endsWith('.astro') ? '(root: cities + niches)' :
                parts[2];
    byCategory[cat] = byCategory[cat] || { files: 0, blocks: 0 };
    byCategory[cat].files++;
    byCategory[cat].blocks += count;
  }
  lines.push('## By category');
  for (const [cat, v] of Object.entries(byCategory).sort((a, b) => b[1].files - a[1].files)) {
    lines.push(`  ${cat}: ${v.files} files, ${v.blocks} blocks`);
  }
  lines.push('');

  lines.push('## All files');
  for (const { file, count } of filesChanged) {
    lines.push(`  ${file}: ${count} block(s)`);
  }

  const output = lines.join('\n');
  const logPath = isApply
    ? 'audit-output/sweep-streetaddress-applied.log'
    : 'audit-output/sweep-streetaddress-dryrun.log';
  writeFileSync(logPath, output, 'utf8');
  console.log(output);
  console.log(`\nLog written to ${logPath}`);
}

main();
