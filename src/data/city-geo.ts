// src/data/city-geo.ts
//
// Approximate centroid (lat, lng) for every city / neighborhood hub in cities.ts.
// Added 2026-10-08 (city stage 1). Used ONLY to compute real nearest neighbours for
// the "Also serving nearby" block (src/lib/nearby.ts) and to pick the nearest real
// customer reviews for pages that have none of their own. Never rendered, never put
// into JSON-LD: a centroid is not an address.
//
// Precision is ~0.01° (well under a mile) — the city's commonly cited centre, or the
// neighborhood's centre for LA neighborhoods (Bel Air, Koreatown, Silver Lake…).
// A page whose slug has no entry here throws at build time (see nearby.ts), so a new
// city cannot ship with an invented neighbour list.

export interface LatLng { lat: number; lng: number }

export const CITY_GEO: Record<string, LatLng> = {
  // ── Los Angeles County ─────────────────────────────────────────────
  'agoura-hills':         { lat: 34.1533, lng: -118.7617 },
  'alhambra':             { lat: 34.0953, lng: -118.1270 },
  'arcadia':              { lat: 34.1397, lng: -118.0353 },
  'atwater-village':      { lat: 34.1164, lng: -118.2563 },
  'bel-air':              { lat: 34.1002, lng: -118.4595 },
  'beverly-hills':        { lat: 34.0736, lng: -118.4004 },
  'brentwood':            { lat: 34.0590, lng: -118.4730 },
  'burbank':              { lat: 34.1808, lng: -118.3090 },
  'calabasas':            { lat: 34.1367, lng: -118.6615 },
  'culver-city':          { lat: 34.0211, lng: -118.3965 },
  'eagle-rock':           { lat: 34.1391, lng: -118.2129 },
  'el-segundo':           { lat: 33.9192, lng: -118.4165 },
  'encino':               { lat: 34.1592, lng: -118.5012 },
  'glassell-park':        { lat: 34.1170, lng: -118.2333 },
  'glendale':             { lat: 34.1425, lng: -118.2551 },
  'highland-park':        { lat: 34.1114, lng: -118.1923 },
  'hollywood':            { lat: 34.0928, lng: -118.3287 },
  'koreatown':            { lat: 34.0618, lng: -118.3004 },
  'la-canada-flintridge': { lat: 34.2064, lng: -118.2001 },
  'long-beach':           { lat: 33.7701, lng: -118.1937 },
  'los-angeles':          { lat: 34.0522, lng: -118.2437 },
  'los-feliz':            { lat: 34.1078, lng: -118.2879 },
  'malibu':               { lat: 34.0259, lng: -118.7798 },
  'manhattan-beach':      { lat: 33.8847, lng: -118.4109 },
  'marina-del-rey':       { lat: 33.9803, lng: -118.4517 },
  'monrovia':             { lat: 34.1442, lng: -117.9990 },
  'monterey-park':        { lat: 34.0625, lng: -118.1228 },
  'north-hollywood':      { lat: 34.1870, lng: -118.3813 },
  'pacific-palisades':    { lat: 34.0481, lng: -118.5265 },
  'pasadena':             { lat: 34.1478, lng: -118.1445 },
  'redondo-beach':        { lat: 33.8492, lng: -118.3884 },
  'san-gabriel':          { lat: 34.0961, lng: -118.1058 },
  'san-marino':           { lat: 34.1214, lng: -118.1065 },
  'santa-monica':         { lat: 34.0195, lng: -118.4912 },
  'sherman-oaks':         { lat: 34.1508, lng: -118.4490 },
  'silver-lake':          { lat: 34.0869, lng: -118.2702 },
  'south-pasadena':       { lat: 34.1161, lng: -118.1503 },
  'studio-city':          { lat: 34.1396, lng: -118.3871 },
  'tarzana':              { lat: 34.1736, lng: -118.5530 },
  'temple-city':          { lat: 34.1072, lng: -118.0579 },
  'toluca-lake':          { lat: 34.1497, lng: -118.3523 },
  'torrance':             { lat: 33.8358, lng: -118.3406 },
  'west-hollywood':       { lat: 34.0900, lng: -118.3617 },
  'west-los-angeles':     { lat: 34.0430, lng: -118.4430 },
  'westwood':             { lat: 34.0635, lng: -118.4455 },
  'woodland-hills':       { lat: 34.1683, lng: -118.6059 },

  // ── Ventura County ─────────────────────────────────────────────────
  'camarillo':            { lat: 34.2164, lng: -119.0376 },
  'moorpark':             { lat: 34.2856, lng: -118.8820 },
  'newbury-park':         { lat: 34.1842, lng: -118.9109 },
  'oak-park':             { lat: 34.1792, lng: -118.7629 },
  'ojai':                 { lat: 34.4481, lng: -119.2429 },
  'oxnard':               { lat: 34.1975, lng: -119.1771 },
  'simi-valley':          { lat: 34.2694, lng: -118.7815 },
  'thousand-oaks':        { lat: 34.1706, lng: -118.8376 },
  'ventura':              { lat: 34.2746, lng: -119.2290 },
  'westlake-village':     { lat: 34.1458, lng: -118.8059 },

  // ── Orange County ──────────────────────────────────────────────────
  'anaheim':              { lat: 33.8366, lng: -117.9143 },
  'costa-mesa':           { lat: 33.6411, lng: -117.9187 },
  'dana-point':           { lat: 33.4672, lng: -117.6981 },
  'fullerton':            { lat: 33.8704, lng: -117.9242 },
  'huntington-beach':     { lat: 33.6595, lng: -117.9988 },
  'irvine':               { lat: 33.6846, lng: -117.8265 },
  'laguna-beach':         { lat: 33.5427, lng: -117.7854 },
  'laguna-niguel':        { lat: 33.5225, lng: -117.7076 },
  'mission-viejo':        { lat: 33.6000, lng: -117.6720 },
  'newport-beach':        { lat: 33.6189, lng: -117.9289 },
  'san-clemente':         { lat: 33.4270, lng: -117.6120 },
  'santa-ana':            { lat: 33.7455, lng: -117.8677 },
  'tustin':               { lat: 33.7458, lng: -117.8262 },
  'villa-park':           { lat: 33.8145, lng: -117.8131 },
  'yorba-linda':          { lat: 33.8886, lng: -117.8131 },

  // ── San Bernardino County ──────────────────────────────────────────
  'chino-hills':          { lat: 33.9898, lng: -117.7326 },
  'fontana':              { lat: 34.0922, lng: -117.4350 },
  'loma-linda':           { lat: 34.0483, lng: -117.2612 },
  'ontario':              { lat: 34.0633, lng: -117.6509 },
  'rancho-cucamonga':     { lat: 34.1064, lng: -117.5931 },
  'redlands':             { lat: 34.0556, lng: -117.1825 },
  'san-bernardino':       { lat: 34.1083, lng: -117.2898 },
  'upland':               { lat: 34.0975, lng: -117.6484 },

  // ── Riverside County ───────────────────────────────────────────────
  'corona':               { lat: 33.8753, lng: -117.5664 },
  'hemet':                { lat: 33.7475, lng: -116.9720 },
  'lake-elsinore':        { lat: 33.6681, lng: -117.3273 },
  'menifee':              { lat: 33.7286, lng: -117.1464 },
  'moreno-valley':        { lat: 33.9425, lng: -117.2297 },
  'murrieta':             { lat: 33.5539, lng: -117.2139 },
  'riverside':            { lat: 33.9533, lng: -117.3962 },
  'temecula':             { lat: 33.4936, lng: -117.1484 },

  // ── Santa Barbara County ───────────────────────────────────────────
  'carpinteria':          { lat: 34.3989, lng: -119.5185 },
  'goleta':               { lat: 34.4358, lng: -119.8276 },
  'hope-ranch':           { lat: 34.4319, lng: -119.7710 },
  'montecito':            { lat: 34.4367, lng: -119.6321 },
  'santa-barbara':        { lat: 34.4208, lng: -119.6982 },
  'summerland':           { lat: 34.4214, lng: -119.5965 },

  // ── San Diego County ───────────────────────────────────────────────
  'carlsbad':             { lat: 33.1581, lng: -117.3506 },
  'del-mar':              { lat: 32.9595, lng: -117.2653 },
  'encinitas':            { lat: 33.0370, lng: -117.2920 },
  'la-jolla':             { lat: 32.8328, lng: -117.2713 },
  'rancho-santa-fe':      { lat: 33.0203, lng: -117.2028 },
  'solana-beach':         { lat: 32.9912, lng: -117.2711 }
};

/** Great-circle distance in miles (haversine). */
export function milesBetween(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
