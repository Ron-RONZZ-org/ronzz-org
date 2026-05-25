# Round 14 Review — Issues Fixed

## High
1. validateEnv() now throws in production for missing ORIGIN/ADMIN_PASSWORD (Rule 45 updated)
2. Route handler tests added: health.test.ts, datasets-api.test.ts, datapoints-api.test.ts, admin-api.test.ts
3. Core tests (datasets, datapoints) now use getDb() singleton path

## Medium
4. search-engine-impl.ts: added negative-offset clamp + limit cap
5. datapoints POST: added DATAPOINT_BULK_MAX = 5000 cap
6. Removed dead code: tests/helpers/init-test-db.ts

## Low
7. Consolidated to global crypto.randomUUID() everywhere
8. Added XSS warning comment in i18n/index.ts
9. Removed 2>/dev/null from Dockerfile prune commands
10. Documented rate limiter restart limitation

## Conventions Added to AGENTS.md
- Rules 46-51: route handler test patterns, getDb() in tests, bulk caps, global crypto.randomUUID()

## New Test Files
- tests/routes/health.test.ts (3 tests)
- tests/routes/datasets-api.test.ts (6 tests)
- tests/routes/datapoints-api.test.ts (6 tests)
- tests/routes/admin-api.test.ts (4 tests)

## Config Changes
- vitest.config.ts: added $lib alias for route handler tests
