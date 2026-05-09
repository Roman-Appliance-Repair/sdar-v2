import { readFile, writeFile } from 'node:fs/promises';
import { google } from 'googleapis';
import { GSC_TOKEN_PATH, GSC_CLIENT_SECRETS, GSC_SITE_URL } from './paths.js';

let cachedAuth = null;
let cachedClient = null;

async function loadOAuth() {
  if (cachedAuth) return cachedAuth;
  const tokenRaw = await readFile(GSC_TOKEN_PATH, 'utf8').catch(() => {
    throw new Error(
      `GSC token not found at ${GSC_TOKEN_PATH}. Run the OAuth bootstrap first ` +
      `(see ~/.gsc/bootstrap_auth.py — token is created on first auth and refreshed automatically).`,
    );
  });
  const token = JSON.parse(tokenRaw);

  const secretsRaw = await readFile(GSC_CLIENT_SECRETS, 'utf8');
  const secrets = JSON.parse(secretsRaw).installed || JSON.parse(secretsRaw).web;
  if (!secrets) throw new Error('Invalid client_secrets.json — no "installed" or "web" key.');

  const oauth2 = new google.auth.OAuth2(secrets.client_id, secrets.client_secret, secrets.redirect_uris?.[0]);
  oauth2.setCredentials({
    refresh_token: token.refresh_token,
    access_token: token.token,
    expiry_date: token.expiry ? new Date(token.expiry).getTime() : undefined,
    token_type: 'Bearer',
    scope: Array.isArray(token.scopes) ? token.scopes.join(' ') : 'https://www.googleapis.com/auth/webmasters',
  });

  oauth2.on('tokens', async (tokens) => {
    if (tokens.refresh_token) token.refresh_token = tokens.refresh_token;
    if (tokens.access_token) token.token = tokens.access_token;
    if (tokens.expiry_date) token.expiry = new Date(tokens.expiry_date).toISOString();
    try {
      await writeFile(GSC_TOKEN_PATH, JSON.stringify(token, null, 2), 'utf8');
    } catch {
      // best-effort; cache write failure shouldn't break the run
    }
  });

  cachedAuth = oauth2;
  return oauth2;
}

async function getClient() {
  if (cachedClient) return cachedClient;
  const auth = await loadOAuth();
  cachedClient = google.searchconsole({ version: 'v1', auth });
  return cachedClient;
}

export async function searchAnalytics({
  startDate,
  endDate,
  dimensions = [],
  rowLimit = 1000,
  dimensionFilterGroups,
  dataState = 'all',
  siteUrl = GSC_SITE_URL,
} = {}) {
  const sc = await getClient();
  const requestBody = { startDate, endDate, dimensions, rowLimit, dataState };
  if (dimensionFilterGroups) requestBody.dimensionFilterGroups = dimensionFilterGroups;
  const res = await sc.searchanalytics.query({ siteUrl, requestBody });
  return res.data;
}

export async function listSitemaps(siteUrl = GSC_SITE_URL) {
  const sc = await getClient();
  const res = await sc.sitemaps.list({ siteUrl });
  return res.data.sitemap || [];
}

export async function getSitemap(feedpath, siteUrl = GSC_SITE_URL) {
  const sc = await getClient();
  const res = await sc.sitemaps.get({ siteUrl, feedpath });
  return res.data;
}

export async function inspectUrl(inspectionUrl, siteUrl = GSC_SITE_URL) {
  const sc = await getClient();
  const res = await sc.urlInspection.index.inspect({
    requestBody: { inspectionUrl, siteUrl, languageCode: 'en-US' },
  });
  return res.data;
}

export async function listSites() {
  const sc = await getClient();
  const res = await sc.sites.list();
  return res.data.siteEntry || [];
}
