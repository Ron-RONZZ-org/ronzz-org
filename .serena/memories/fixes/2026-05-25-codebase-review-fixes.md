# Codebase Review Fixes (2026-05-25)

## Scope
Addressed comprehensive code review findings from @reviewer.

## Changes

### Test Helper Deduplication
- Created `tests/helpers/create-test-tables.ts` — single source of truth for SQLite test table creation (all 9 tables)
- Created `tests/helpers/mock-event.ts` — single source of truth for SvelteKit RequestEvent mocks
- Updated 9 test files to import from shared helpers instead of duplicating

### Core Test `getDb()` Compliance (Rule 48)
- `tests/ronlib-core/resources.test.ts` → uses `getDb()` + `createTestTables()` instead of creating own DB
- `tests/ronencik-core/articles.test.ts` → same pattern
- These now exercise the `database/schema/proxy` and `database/dialect-query` code paths

### Health Endpoint DB Ping
- `api/v1/health/+server.ts` now performs `SELECT 1` ping via dialect-appropriate execution method
- Previously just checked `if (db)` which always returned "connected" even if PG pool was dead

### Token Prefix Fix
- `lib/tokens/+page.server.ts` now derives prefix from actual token value (`token.slice(0, 12)`)
- Previously generated independent random prefix that didn't match the token, making it unidentifiable
- Removed unused `randomBytes` import

### Stats Page Pagination Cap
- `stats/[uuid]/+page.server.ts` now limits datapoints to 1000 per page load
- Prevents memory exhaustion on large datasets

## Verification
- All 194 tests pass across 26 test files
- svelte-check passes (pre-existing d3 type errors only)
- Issue #37 created and closed
- AGENTS.md updated: new rule 46 for shared test helpers
