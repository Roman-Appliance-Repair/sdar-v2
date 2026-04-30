#!/usr/bin/env node
/**
 * sweep-aggregate-rating-removal.mjs
 *
 * Removes `aggregateRating: { ... }` blocks from JSON-LD schemas across
 * all src/pages/**\/*.astro files per NAP/Rating SSOT Rule 3
 * (wiki/decisions/nap-rating-policy-ssot.md).
 *
 * Handles three observed patterns:
 *
 *   A. Multi-line YAML-style (most city pages):
 *      ```
 *      license: 'CA CSLB #1138898',
 *      aggregateRating: {
 *        '@type': 'AggregateRating',
 *        ratingValue: '4.6',
 *        reviewCount: '37',
 *        bestRating: '5',
 *      },
 *      ```
 *
 *   B. Multi-line JSON quoted (luxury combos):
 *      ```
 *      },
 *      "aggregateRating": {
 *        "@type": "AggregateRating",
 *        "ratingValue": "4.6",
 *        "reviewCount": "37"
 *      },
 *      ```
 *
 *   C. Single-line inline (county pages, for-business, price-list):
 *      ```
 *      "priceRange": "$$",
 *      "aggregateRating": { "@type": "AggregateRating", ... }
 *      ```
 *
 * Rules:
 *   - aggregateRating block is removed in full.
 *   - aggregateRating contents have no nested `{ }` (only flat string/number
 *     values), so single-pass regex with `[^{}]*` is safe.
 *   - Trailing comma after the closing `}` is removed if present.
 *   - If aggregateRating is the LAST property in its parent (no trailing
 *     comma), the comma on the PREVIOUS property line is removed instead
 *     to keep the JSON object valid.
 *   - Files where `aggregateRating` only appears in comments are not
 *     modified (regex requires the colon-bracket pattern).
 *
 * Modes:
 *   --dry-run (default): logs counts to audit-output/sweep-agg-rating-dryrun.log
 *   --apply: writes changes to disk
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const isApply = process.argv.includes('--apply');
const PAGES_DIR = 'src/pages';

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) yield full;
  }
}

/**
 * Remove the aggregateRating block from a string of source code.
 *
 * Strategy: match `,?\s*"?aggregateRating"?\s*:\s*\{ ... \}\s*,?` allowing
 * for multi-line content (no nested braces inside aggregateRating object).
 * Then look at what was around the match to decide whether to:
 *   (a) drop both leading and trailing whitespace (block + own comma)
 *   (b) keep one delimiter (handle "last property" case)
 *
 * Returns { text, count } — count = number of blocks removed.
 */
function removeAggregateRating(text) {
  let count = 0;
  // Match: optional comma + whitespace, then aggregateRating: { ... },
  // The body has no nested `{ }` so [^{}]* is safe.
  // We capture: the leading whitespace/newline before aggregateRating, the
  // optional leading comma, the block itself, and the optional trailing comma.
  const re = /([ \t]*)"?aggregateRating"?\s*:\s*\{[^{}]*\}(\s*,)?\n?/g;

  // Single pass: remove all aggregateRating blocks. Then clean up dangling
  // commas (case where aggregateRating was the LAST field in its parent
  // object — a `,` on the previous line is now invalid).
  let out = text.replace(re, () => {
    count++;
    return '';
  });

  if (count === 0) return { text: out, count };

  // Cleanup: any line that ends with `,\n` followed by `\n` `}` or `\n` `</script>`
  // means there's a trailing-comma-before-close-brace situation. Fix by
  // removing that comma.
  // Pattern: `,\s*\n\s*}` — comma, whitespace+newline, close-brace
  // But only at the end of an object literal (object close brace).
  // Match safely: `[^a-zA-Z_]\,\s*\n\s*\}` (avoid matching inside strings).
  // Simpler: handle `,\n  }` (typical formatted close).
  out = out.replace(/,(\s*\n\s*})/g, '$1');
  // Also `,\s*}` on single line:
  out = out.replace(/,(\s*})/g, '$1');

  return { text: out, count };
}

function main() {
  const allFiles = [...walk(PAGES_DIR)];
  const filesChanged = [];
  let totalBlocks = 0;

  for (const f of allFiles) {
    if (!f.endsWith('.astro')) continue;
    const text = readFileSync(f, 'utf8');
    if (!text.includes('aggregateRating')) continue;

    const { text: out, count } = removeAggregateRating(text);
    if (count > 0 && out !== text) {
      filesChanged.push({ file: f, count });
      totalBlocks += count;
      if (isApply) {
        writeFileSync(f, out, 'utf8');
      }
    }
  }

  // Build report
  const lines = [];
  lines.push(`# aggregateRating Sweep — ${isApply ? 'APPLIED' : 'DRY-RUN'}`);
  lines.push('');
  lines.push(`Files scanned: ${allFiles.length}`);
  lines.push(`Files with aggregateRating block: ${filesChanged.length}`);
  lines.push(`Total blocks removed: ${totalBlocks}`);
  lines.push('');

  // Categorize
  const byCategory = {};
  for (const { file, count } of filesChanged) {
    const parts = file.replace(/\\/g, '/').split('/');
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
    const rel = file.replace(/\\/g, '/');
    lines.push(`  ${rel}: ${count} block(s)`);
  }

  const output = lines.join('\n');
  const logPath = isApply
    ? 'audit-output/sweep-agg-rating-applied.log'
    : 'audit-output/sweep-agg-rating-dryrun.log';
  writeFileSync(logPath, output, 'utf8');
  console.log(output);
  console.log(`\nLog written to ${logPath}`);
}

main();
