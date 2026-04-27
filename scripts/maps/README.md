# SoCal county map pipeline

Generates `src/data/county-boundaries.ts` and `public/maps/socal-counties.svg`
from public-domain Census Bureau data.

## Files in this folder

| File | Source / produced by | Committed? |
|---|---|---|
| `socal-raw.geojson` | downloaded (Click That Hood mirror, public domain) | ❌ — re-downloadable, in `.gitignore` |
| `socal-5counties.geojson` | `mapshaper -filter -simplify` | ✅ |
| `socal-projected.geojson` | `mapshaper -proj +proj=aea …` | ✅ |
| `branch-points.geojson` | hand-written (lon/lat from `src/data/branches.ts`) | ✅ |
| `branch-points-projected.geojson` | `mapshaper -proj` | ✅ |
| `geojson-to-svg.mjs` | the conversion script | ✅ |

## Regenerate from scratch

```sh
# 1. Download the raw California counties GeoJSON
curl -sSL -o scripts/maps/socal-raw.geojson \
  https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/california-counties.geojson

# 2. Filter to 5 counties + simplify
npx mapshaper@latest scripts/maps/socal-raw.geojson \
  -filter '["Los Angeles","Orange","Ventura","San Bernardino","Riverside"].indexOf(name) !== -1' \
  -simplify 15% keep-shapes \
  -o scripts/maps/socal-5counties.geojson

# 3. Project counties to Albers Equal Area Conic (CA-tuned)
npx mapshaper@latest scripts/maps/socal-5counties.geojson \
  -proj '+proj=aea +lat_1=34 +lat_2=40.5 +lat_0=0 +lon_0=-120 +x_0=0 +y_0=-4000000 +datum=NAD83 +units=m +no_defs' \
  -o scripts/maps/socal-projected.geojson

# 4. Project branch points through the same Albers transform
#    (regenerate scripts/maps/branch-points.geojson by hand if branches.ts
#     city-center coords change, then re-run this step)
npx mapshaper@latest scripts/maps/branch-points.geojson \
  -proj '+proj=aea +lat_1=34 +lat_2=40.5 +lat_0=0 +lon_0=-120 +x_0=0 +y_0=-4000000 +datum=NAD83 +units=m +no_defs' \
  -o scripts/maps/branch-points-projected.geojson

# 5. Generate src/data/county-boundaries.ts + public/maps/socal-counties.svg
node scripts/maps/geojson-to-svg.mjs
```

## Why this design

- Census Bureau data is the canonical authoritative source for US county
  boundaries — public domain, accurate, versioned.
- mapshaper is the standard tool for filter / simplify / project; same machine
  produces the same output.
- The Albers projection is chosen for visual fidelity in California
  (lat_1=34, lat_2=40.5 are the standard parallels for CA).
- The conversion script is plain Node — no build step, no transpile — so it
  re-runs cleanly with no maintenance.
