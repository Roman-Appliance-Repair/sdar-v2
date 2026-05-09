const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

export function color(c, s) {
  if (!useColor) return s;
  return ANSI[c] + s + ANSI.reset;
}

export function pct(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export function num(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US');
}

export function delta(curr, prev, { asPct = true } = {}) {
  if (prev === null || prev === undefined || prev === 0) return '—';
  const diff = curr - prev;
  const ratio = diff / prev;
  const sign = diff > 0 ? '+' : '';
  return asPct ? `${sign}${(ratio * 100).toFixed(1)}%` : `${sign}${num(diff)}`;
}

export function arrow(curr, prev) {
  if (prev === null || prev === undefined) return '·';
  if (curr > prev) return color('green', '↑');
  if (curr < prev) return color('red', '↓');
  return '·';
}

export function h1(s) { return `# ${s}\n`; }
export function h2(s) { return `\n## ${s}\n`; }
export function h3(s) { return `\n### ${s}\n`; }

export function bullet(s, indent = 0) {
  return `${'  '.repeat(indent)}- ${s}`;
}

export function table(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
}

export function callout(kind, lines) {
  const tag = { info: 'ℹ', warn: '⚠', ok: '✓', fail: '✗' }[kind] || '·';
  return [`> ${tag} ${lines[0]}`, ...lines.slice(1).map((l) => `> ${l}`)].join('\n');
}

export function timestamp(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  return { iso: `${yyyy}-${mm}-${dd}`, file: `${yyyy}-${mm}-${dd}-${HH}${MM}` };
}

export function isoDateMinusDays(days, base = new Date()) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function safeDiv(a, b) {
  if (!b || b === 0) return null;
  return a / b;
}

export function stddev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
