# Code Review Round 3 Fixes (2026-05-24)

## Summary
Third round of code review fixes addressing findings from comprehensive codebase review. 

## Changes

### 1. closeDb() — Proper Connection Teardown (High)
- `database/db.ts`: `closeDb()` now actually closes SQLite (`better-sqlite3 .close()`) and PG (`Pool.end()`) connections
- Stores underlying client handle (`_dbClient`) for proper cleanup
- `resetDb()` also resets dialect cache

### 2. Bulk Datapoints Insert in Transaction (High)
- `packages/@ronzz/ronstats-core/src/queries/datapoints.ts`: `bulkCreateDatapoints()` now wraps the insert in `db.transaction()` for all-or-nothing semantics

### 3. Search Total Count (High)
- `packages/@ronzz/search-core/src/types.ts`: New `SearchResultSet` interface with `{ results, total }`
- `SqliteSearchEngine` and `PostgresSearchEngine`: `search()` now returns total count via parallel count query
- Both search route handlers updated to use `resultSet.total`

### 4. Schema Proxy — Dynamic Dialect Detection (Medium)
- `database/schema/proxy.ts`: Added `resetDialectCache()` function to clear cached dialect
- `database/db.ts`: `resetDb()` calls `resetDialectCache()` for test isolation

### 5. Extract Duplicated formatNumber() (Medium)
- `packages/@ronzz/ronstats-core/src/charts/renderers/format-number.ts`: New shared utility
- Both `line.ts` and `bar.ts` import from this module

### 6. Extract Duplicated toLocale() (Low)
- Added to `packages/@ronzz/shared-core/src/i18n/index.ts`
- Both `datasets.ts` and `resources.ts` query files import from shared-core

### 7. Remove Unused Code (Low)
- `packages/@ronzz/ronstats-core/src/charts/renderers/pie.ts`: Removed unused `categoryColors` array

### 8. Trash Listing Pagination (Low)
- `listTrashDatasets()` and `listTrashResources()` now accept `{ limit, offset }` options
- Return `{ items, total }` instead of raw array
- Trash route handler passes query params

### 9. Sitemap/RSS Caching (Low)
- New `TtlCache<T>` in `packages/@ronzz/shared-core/src/cache/ttl-cache.ts`
- Sitemap cached for 30 min, RSS feed cached for 15 min

### 10. tryResult Error Specificity (Low)
- Preserves original error message instead of generic "Internal error"

### 11. Rate Limiter Map Size Limit (Low)
- `MAX_STORE_SIZE = 10_000` with eviction of oldest entries

### 12. Request Body Size Limits (Medium)
- `hooks.server.ts`: Rejects requests with Content-Length > 1 MB (413)

### Test Updates
- Search engine tests: `search()` result destructured to `{ results, total }`
- Trash tests: destructured to `{ datasets, total }` / `{ resources, total }`
- Test setup: `closeDb()` called in `afterEach` for clean teardown

## Files Changed
30 files changed across apps/web, database, packages/shared-core, packages/search-core, packages/ronstats-core, packages/ronlib-core, tests/

## Branch
`fix/round-3-code-review-fixes`
