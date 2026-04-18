// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://samedayappliance.repair',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  redirects: {
    '/brand-thermador-appliance-repair/': '/brands/thermador/',
    '/brands/thermador-wall-oven-repair/': '/brands/thermador-oven-repair/',
    '/brand-subzero-appliance-repair/': '/brands/sub-zero/',
    '/sub-zero-freezer-repair-los-angeles/': '/brands/sub-zero-refrigerator-repair/',
    '/miele-stove-repair-los-angeles/': '/brands/miele/',

    // Viking cluster — канонизация URL structure + kill matrix cannibalization
    '/brands/viking-repair/': '/brands/viking/',
    '/brands/viking/viking-refrigerator-repair/': '/brands/viking-refrigerator-repair/',
    '/brands/viking/viking-range-repair/': '/brands/viking-range-repair/',
    '/brands/viking/viking-bbq-grill-repair/': '/brands/viking-bbq-grill-repair/',
    '/brands/viking/viking-oven-repair/': '/brands/viking-oven-repair/',
    '/brands/viking/viking-cooktop-repair/': '/brands/viking-cooktop-repair/',
  },
});
