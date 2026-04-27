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
    labelX: 95.13,
    labelY: 380.71,
    path: 'M145.57 347.95L133.74 319.36L117.05 319.54L117 314.97L70.27 314.98L70.2 305.76L64.34 301.11L45.88 301.24L42.45 296.69L35.38 296.71L35.56 325.65L35.75 329.87L35.95 391.5L35.46 401.35L30 408.94L32.87 408.8L54.54 426.26L65.46 431.95L76.19 456.83L91.82 466.46L99.62 466.82L124.39 477.75L125.04 471.52L151.62 451.39L172.93 451.11L172.79 435.77L178.09 424.78L145.57 347.95Z',
  },
  {
    slug: 'los-angeles',
    name: 'Los Angeles County',
    hubUrl: '/los-angeles-county/',
    labelX: 262.22,
    labelY: 398.95,
    path: 'M124.39 477.75L140.45 479.95L148.57 486.81L161.43 479.97L194.92 478.26L202.54 483.28L211.5 495.01L223.06 520.5L217.71 534.72L239.92 547.37L248.16 534.37L272.36 539.1L272.49 538.97L272.82 538.75L281.84 517.64L296.17 505.3L295.99 496.12L330.18 495.28L328.32 493.75L332.55 478.85L338.21 479.76L347.6 449.06L352.6 421.92L347.55 364.91L346.12 308.71L333.62 308.86L202.24 312.63L138.42 313.54L132.76 316.98L145.57 347.95L178.09 424.78L172.79 435.77L172.93 451.11L151.62 451.39L125.04 471.52L124.39 477.75Z',
  },
  {
    slug: 'orange',
    name: 'Orange County',
    hubUrl: '/orange-county/',
    labelX: 319.47,
    labelY: 532.06,
    path: 'M330.18 495.28L295.99 496.12L296.17 505.3L281.84 517.64L272.82 538.75L292.26 557.68L300.9 563.68L313.14 567.15L331.67 581.06L344.72 597.28L359.47 603.88L366.34 613.31L369.09 598.9L381.25 594.82L381.07 588.81L381.02 586.89L380.79 581.6L397.36 554.61L386.17 545.4L375.59 544.29L374.89 534.26L366.97 531.96L349.73 511.31L349.36 510.26L336.42 500.35L330.18 495.28Z',
  },
  {
    slug: 'san-bernardino',
    name: 'San Bernardino County',
    hubUrl: '/san-bernardino-county/',
    labelX: 539,
    labelY: 283.25,
    path: 'M346.12 308.71L347.55 364.91L352.6 421.92L347.6 449.06L338.21 479.76L332.55 478.85L328.32 493.75L336.42 500.35L349.36 510.26L349.95 510.86L352.92 499.25L360.78 499.06L360.64 489.18L369.74 485.38L369.51 475.82L401.85 474.87L401.91 477.94L428.44 477.33L428.53 480.39L480.85 478.65L480.62 472.45L591.75 468.81L647.51 465.99L765.6 460.79L765.17 451.51L920.53 442.71L923.62 436.59L939.35 429.46L951.41 420.78L966.07 403.38L970 392.16L962.61 382.81L953.74 379.82L932.71 362.89L924.37 362.01L924.49 346.71L906.3 308.78L891.46 298.16L883.62 282.8L877.08 278.39L874.5 249.1L777.22 163.64L689.64 86.69L674.68 90.69L581.19 94.68L516.6 96.66L412.96 100.08L346.95 101.39L348.69 150.95L352.3 308.62L346.12 308.71Z',
  },
  {
    slug: 'riverside',
    name: 'Riverside County',
    hubUrl: '/riverside-county/',
    labelX: 841.49,
    labelY: 516.25,
    path: 'M349.95 510.86L349.73 511.31L366.97 531.96L374.89 534.26L375.59 544.29L386.17 545.4L397.36 554.61L380.79 581.6L381.02 586.89L381.04 587.75L406.92 587.05L405.82 590.15L429.08 598.33L429.22 601.82L474.14 601.48L561.12 598.66L631.02 596.13L639.65 595.76L719.75 592.05L858.29 584.37L894.48 581.62L894.95 576.7L905.56 559.94L911.26 555.43L909.74 527.1L914.47 524.49L906.75 492.79L911.08 488.77L904.85 476.38L920.74 454.85L920.53 442.71L765.17 451.51L765.6 460.79L647.51 465.99L591.75 468.81L480.62 472.45L480.85 478.65L428.53 480.39L428.44 477.33L401.91 477.94L401.85 474.87L369.51 475.82L369.74 485.38L360.64 489.18L360.78 499.06L352.92 499.25L349.95 510.86Z',
  },
];

/** City center positions in SVG coordinate space — for branch pins. */
export const BRANCH_PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'west-hollywood': { x: 227.3, y: 466.87 },
  'beverly-hills': { x: 222.5, y: 472.5 },
  'los-angeles': { x: 248.29, y: 474.52 },
  'pasadena': { x: 265.42, y: 453.89 },
  'thousand-oaks': { x: 143.02, y: 450.99 },
  'irvine': { x: 323.81, y: 551.03 },
  'rancho-cucamonga': { x: 362.97, y: 460.49 },
  'temecula': { x: 445.4, y: 588.36 },
};
