# 2026-07-13 — Info-layer internal-linking weld

**Merge:** `13560a58` (feature/info-interlinking → main, fast-forward). Backup: `backup/pre-interlinking`.

## Result
- 77 info pages welded to legacy site both directions. **Orphans 34 → 0** (every info page ≥2 inbound, min=2).
- 171 links added / 56 files. Build 1170, 0 err throughout. dist link-resolve verified per batch (0 missing/redirect).

## Batches
- 1 (`320e37f6`): service hubs → info children — 69 links, 8 hubs (diagnostic-guide nav sections, brands inline).
- 2 (`e7dd9147`): brand combos → matching snipers — 49 exact-match, 33 pages ("Related diagnostic guides" callout after intro).
- 3 (`c87c9206`): info-mesh completion — 37 links, generic umbrellas → all brand snipers; closed all orphans.
- 4 (city): SKIPPED — A-variant weave-only has no valid target (parametric combos = all-908 not 36; pillar mentions in grid-data / FAQ→schema).
- 5 (`13560a58`): blog → topical info — 16 links, 10 posts (1 skip: best-dishwashing-machines-2024 no file).

## Deploy
- Live ~195s. Spot-check ✅: dryer hub guides section (samsung-not-heating/squeaking/error-codes/speed-queen), samsung-dryer-repair callout → sniper, sniper 200.
- IndexNow → 200 (16 URLs: 8 hubs + 3 umbrellas + 5 brand combos; content-changed existing URLs).

## Open
- City batch option: one combo-template weave would give service umbrellas inbound from all 908 combos (over-delivers vs Roman's "36 top cities") — deferred to Roman's decision.

Plan: wiki research/interlinking-plan.md (11929a5).
