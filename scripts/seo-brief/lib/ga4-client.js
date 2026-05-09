import { google } from 'googleapis';
import { GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT } from './paths.js';

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const auth = new google.auth.GoogleAuth({
    keyFile: GA4_SERVICE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  const client = await auth.getClient();
  cachedClient = google.analyticsdata({ version: 'v1beta', auth: client });
  return cachedClient;
}

export async function runReport({
  dateRanges,
  dimensions = [],
  metrics,
  dimensionFilter,
  metricFilter,
  orderBys,
  limit = 1000,
  propertyId = GA4_PROPERTY_ID,
} = {}) {
  if (!metrics) throw new Error('runReport: metrics required');
  if (!dateRanges) throw new Error('runReport: dateRanges required');
  const ga = await getClient();
  const res = await ga.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges,
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      dimensionFilter,
      metricFilter,
      orderBys,
      limit,
    },
  });
  return res.data;
}

export function rowsToObjects(report) {
  if (!report?.rows) return [];
  const dimNames = (report.dimensionHeaders || []).map((h) => h.name);
  const metricNames = (report.metricHeaders || []).map((h) => h.name);
  return report.rows.map((row) => {
    const out = {};
    (row.dimensionValues || []).forEach((v, i) => { out[dimNames[i]] = v.value; });
    (row.metricValues || []).forEach((v, i) => {
      const num = Number(v.value);
      out[metricNames[i]] = Number.isFinite(num) ? num : v.value;
    });
    return out;
  });
}
