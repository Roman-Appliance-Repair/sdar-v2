import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(here, '..', '..', '..');
export const WIKI_ROOT = resolve(homedir(), 'projects', 'sdar-v2-wiki', 'sdar-v2-wiki');
export const BRIEFINGS_DIR = resolve(WIKI_ROOT, 'briefings');

export const STATE_FILES = {
  projectState: resolve(BRIEFINGS_DIR, 'project-state.json'),
  baseline: resolve(BRIEFINGS_DIR, 'baseline.json'),
  cooling: resolve(BRIEFINGS_DIR, 'cooling.json'),
  coverageSnapshot: resolve(BRIEFINGS_DIR, 'coverage-snapshot.json'),
  manualRequests: resolve(BRIEFINGS_DIR, 'manual-index-requests.json'),
  indexnowLog: resolve(BRIEFINGS_DIR, 'indexnow-log.json'),
};

export const GA4_PROPERTY_ID = '498305027';
export const GSC_SITE_URL = 'sc-domain:samedayappliance.repair';
export const SITE_DOMAIN = 'samedayappliance.repair';
export const SITE_ORIGIN = `https://${SITE_DOMAIN}`;
export const SITEMAP_INDEX_URL = `${SITE_ORIGIN}/sitemap-index.xml`;
export const INDEXNOW_KEY = '32c2d9cecb72408cbd6f91136388e33a';

export const GA4_SERVICE_ACCOUNT = resolve(REPO_ROOT, 'secrets', 'sdar-analytics-65ba2e820adb.json');
export const GSC_TOKEN_PATH = resolve(process.env.LOCALAPPDATA || resolve(homedir(), 'AppData', 'Local'), 'mcp-gsc', 'mcp-gsc', 'token.json');
export const GSC_CLIENT_SECRETS = resolve(homedir(), '.gsc', 'client_secrets.json');
