# Issue #8: High-Severity Fixes

## What
Fixed 6 high-severity issues found during code review (May 2026).

## Key Changes

### 1. i18n SSR Race Condition (largest change)
- Removed module-level `_currentLocale`/`_currentBundle` globals
- `t()` and `tr_multi()` now take explicit `locale: Locale` as first param
- Removed `setLocale()` and `getLocale()` exports
- Removed `$effect(() => setLocale(data.locale))` from `+layout.svelte`
- Updated all 10 Svelte page components + Nav.svelte + tests
- Each page extracts `const locale = data.locale` from its `data` prop
- Pattern: always pass locale explicitly, never set module-level state

### 2. Sitemap Soft-Delete Filter
- Added `where(isNull(datasets.deletedAt))` to the sitemap query

### 3. Token Prefix Entropy
- Changed from `prefix = token.slice(0, 14)` (leaked 32 bits)
- New: `prefix = "ronzz_" + randomBytes(4).toString("hex")` (independent random value)

### 4. Datapoints Pagination
- `listDatapoints()` now accepts optional `{ limit?, offset? }` options object
- Added `countDatapoints()` function
- API endpoint: `?limit=N&offset=M` with default 1000, max 10000
- Response includes `{ datapoints, pagination: { limit, offset, total } }`

### 5. CSP (Not-a-bug)
- Added inline comment explaining why `unsafe-inline` is intentionally omitted
- Nonce-based CSP provides correct fallback for CSP 2 browsers

### 6. Rate Limiter (Documented)
- Added inline comment: single-container deployment assumption
- Current deployment uses 1 app container (see docker-compose.yml)

## Files Changed
21 files, +151/-96 lines across `@ronzz/shared-core`, `@ronzz/ronstats-core`, `@ronzz/ui`, `apps/web`, `tests/`.

## Commit
`8b9385e` on branch `fix/issue-8-high-severity-issues`, merged to `main`.
