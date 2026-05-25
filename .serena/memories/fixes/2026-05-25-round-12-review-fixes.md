# Round 12 — Code Review Fixes (2026-05-25)

## Summary
Addressed 10 findings from comprehensive code review. Fixed all high and medium severity issues.

## Changes

### High Severity
- **H1**: `packages/@ronzz/search-core/src/engine.ts` — search engine singleton now tracks dialect via `_engineDialect` and re-creates when `detectDialect()` returns a different value; `resetSearchEngine()` clears both engine and dialect
- **H2**: `apps/web/src/routes/lib/login/+page.server.ts` — wrapped login action in try/catch returning `fail(500, ...)` on DB failures; added email format validation (`EMAIL_RE` regex) to reject garbage input early
- **H3**: `apps/web/src/hooks.server.ts` — added streaming body size check for chunked transfer encoding without Content-Length; body is buffered and replaced as new `Request` if within limit

### Medium Severity
- **M1**: `packages/@ronzz/search-core/src/search-engine-impl.ts` — replaced custom `dbRun` helper and inline `.all()`/`.get()` calls with `queryAll`/`queryGet`/`queryRun` from `database/dialect-query`
- **M2**: Created `packages/@ronzz/shared-core/src/escape-like.ts` — extracted `escapeLike()` to shared utility; removed duplicate definitions from `datasets.ts` and `resources.ts`
- **M3**: Added `validateEnv()` in `hooks.server.ts` — warns at startup in production if `ORIGIN` or `ADMIN_PASSWORD` env vars are missing

### Pre-existing Bug Fix
- **B1**: Fixed `queryGet()` in `database/dialect-query.ts` — PG SELECT queries return arrays, must extract `[0]`; was returning the entire array as the "row"

### Conventions Added to AGENTS.md
Rules 39-44: escapeLike import from shared-core, queryGet PG array extraction, search engine dialect tracking, login try/catch, chunked body handling, startup env validation

## New Tests
- `tests/shared-core/escape-like.test.ts` — 7 tests
- `tests/database/dialect-query.test.ts` — 6 tests

## Verification
- 166 tests pass (21 files, up from 153/19)
- Biome lint clean
- All files under 500 lines
- Branch: `fix/round-12-review-fixes`, fast-forward merged to main
- Issue #33 created and closed
