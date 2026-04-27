// AUTO-GENERATED from scripts/maps/socal-projected.geojson
// DO NOT EDIT manually — re-run scripts/maps/geojson-to-svg.mjs to regenerate.
//
// Pipeline:
//   1. Click That Hood CA counties → socal-raw.geojson
//   2. mapshaper -filter to 5 counties + -simplify 15% keep-shapes
//   3. mapshaper -proj Albers Equal Area (lat_1=34 lat_2=40.5 lon_0=-120)
//   4. node scripts/maps/geojson-to-svg.mjs

export type CountySlug = 'los-angeles' | 'orange' | 'ventura' | 'san-bernardino' | 'riverside';

export interface CountyBoundary {
  /** Slug matching cities.ts COUNTIES keys */
  slug: CountySlug;
  /** Display name for hover labels */
  name: string;
  /** SVG path d= attribute string */
  path: string;
  /** URL to county hub page */
  hubUrl: string;
  /** Approximate label position inside the county (visual centroid via polylabel) */
  labelX: number;
  labelY: number;
}

export const SVG_VIEWBOX = '0 0 1000 700';
export const SVG_WIDTH = 1000;
export const SVG_HEIGHT = 700;

export const COUNTY_BOUNDARIES: CountyBoundary[] = [
  {
    slug: 'ventura',
    name: 'Ventura County',
    hubUrl: '/ventura-county/',
    labelX: 111.17,
    labelY: 318.04,
    path: 'M160.58 285.95L149 257.94L132.64 258.12L132.59 253.63L86.82 253.65L86.74 244.61L81 240.06L62.92 240.18L59.56 235.73L52.63 235.75L52.81 264.09L53 268.23L53.19 328.61L52.71 338.26L47.36 345.7L50.18 345.56L71.4 362.66L82.1 368.24L92.61 392.61L107.93 402.05L115.57 402.4L139.83 413.11L140.47 407L166.51 387.29L187.39 387.01L187.25 371.98L192.44 361.21L160.58 285.95Z M31.75 575.86L36.72 583.06L50.05 586.66L51.39 577.89L39.59 572.09L31.75 575.86Z',
  },
  {
    slug: 'los-angeles',
    name: 'Los Angeles County',
    hubUrl: '/los-angeles-county/',
    labelX: 274.86,
    labelY: 335.91,
    path: 'M139.83 413.11L155.57 415.26L163.52 421.98L176.12 415.28L208.93 413.61L216.39 418.52L225.17 430.02L236.5 454.99L231.25 468.92L253.02 481.31L261.09 468.57L284.79 473.21L284.92 473.09L285.25 472.86L294.08 452.18L308.12 440.09L307.95 431.1L341.44 430.28L339.62 428.78L343.76 414.18L349.3 415.08L358.5 385L363.4 358.41L358.46 302.56L357.06 247.51L344.81 247.65L216.1 251.34L153.58 252.23L148.03 255.61L160.58 285.95L192.44 361.21L187.25 371.98L187.39 387.01L166.51 387.29L140.47 407L139.83 413.11Z M230.93 540.44L219.96 537.76L212.04 530.58L205.86 538.09L221.15 542.57L221.1 555.32L229.57 563.09L241.3 562.62L251.1 557.53L230.93 540.44Z M211.49 628.95L207.49 636.06L220.86 660.25L233.54 670L243.67 662.45L223.07 645.27L211.49 628.95Z',
  },
  {
    slug: 'orange',
    name: 'Orange County',
    hubUrl: '/orange-county/',
    labelX: 330.95,
    labelY: 466.31,
    path: 'M341.44 430.28L307.95 431.1L308.12 440.09L294.08 452.18L285.25 472.86L304.29 491.42L312.75 497.29L324.75 500.69L342.9 514.31L355.68 530.21L370.13 536.67L376.86 545.91L379.55 531.8L391.47 527.8L391.3 521.91L391.25 520.03L391.02 514.85L407.25 488.4L396.29 479.38L385.93 478.29L385.24 468.47L377.48 466.21L360.6 445.98L360.23 444.95L347.56 435.25L341.44 430.28Z',
  },
  {
    slug: 'san-bernardino',
    name: 'San Bernardino County',
    hubUrl: '/san-bernardino-county/',
    labelX: 546.01,
    labelY: 222.56,
    path: 'M357.06 247.51L358.46 302.56L363.4 358.41L358.5 385L349.3 415.08L343.76 414.18L339.62 428.78L347.56 435.25L360.23 444.95L360.81 445.54L363.72 434.17L371.42 433.98L371.28 424.31L380.2 420.58L379.97 411.22L411.66 410.28L411.72 413.29L437.7 412.7L437.79 415.69L489.05 413.98L488.82 407.91L597.69 404.35L652.32 401.59L768.01 396.49L767.59 387.4L919.78 378.78L922.82 372.78L938.23 365.79L950.04 357.29L964.4 340.25L968.25 329.26L961.01 320.1L952.33 317.17L931.72 300.58L923.55 299.71L923.67 284.73L905.85 247.57L891.31 237.17L883.63 222.12L877.22 217.8L874.7 189.11L779.39 105.38L693.59 30L678.93 33.92L587.34 37.83L524.07 39.76L422.54 43.12L357.87 44.39L359.57 92.95L363.11 247.41L357.06 247.51Z',
  },
  {
    slug: 'riverside',
    name: 'Riverside County',
    hubUrl: '/riverside-county/',
    labelX: 842.36,
    labelY: 450.82,
    path: 'M360.81 445.54L360.6 445.98L377.48 466.21L385.24 468.47L385.93 478.29L396.29 479.38L407.25 488.4L391.02 514.85L391.25 520.03L391.27 520.87L416.62 520.18L415.54 523.22L438.33 531.23L438.46 534.66L482.47 534.32L567.69 531.56L636.17 529.08L644.62 528.71L723.09 525.08L858.81 517.56L894.27 514.87L894.73 510.05L905.13 493.62L910.71 489.21L909.22 461.46L913.85 458.89L906.29 427.84L910.53 423.91L904.43 411.77L919.99 390.67L919.78 378.78L767.59 387.4L768.01 396.49L652.32 401.59L597.69 404.35L488.82 407.91L489.05 413.98L437.79 415.69L437.7 412.7L411.72 413.29L411.66 410.28L379.97 411.22L380.2 420.58L371.28 424.31L371.42 433.98L363.72 434.17L360.81 445.54Z',
  },
];

/** City center positions in SVG coordinate space — for branch pins (Phase B) */
export const BRANCH_PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'west-hollywood': { x: 240.65, y: 402.45 },
  'los-angeles': { x: 261.22, y: 409.94 },
  'pasadena': { x: 278, y: 389.73 },
  'thousand-oaks': { x: 158.09, y: 386.89 },
  'irvine': { x: 335.19, y: 484.89 },
  'rancho-cucamonga': { x: 373.56, y: 396.2 },
  'temecula': { x: 454.31, y: 521.47 },
};
