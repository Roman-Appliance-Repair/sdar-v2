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
  },
});
