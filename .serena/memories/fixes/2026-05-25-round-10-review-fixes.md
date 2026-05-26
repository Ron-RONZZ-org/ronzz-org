# Round 10 — Code Review Fixes (2026-05-25)

## What was fixed

### Critical: Encik admin route (`apps/web/src/routes/encik/api/v1/admin/articles/+server.ts`)
- Added `requireAdmin(locals)` check — was only checking `!locals.user` (rule 18)
- Wrapped handlers with `apiHandler()` for JSON error handling (rule 23)
- Added `Math.min()` cap on `limit` param with `MAX_LIMIT=200` (rule 24)
- DELETE returns `204 No Content` instead of `200 { deleted: true }` (rule 25)

### Dialect detection (`apps/web/src/routes/lib/change-password/+page.server.ts`)
- Replaced `(process.env.DATABASE_URL ?? "").startsWith("postgres")` with `detectDialect() === "pg"` (rule 13/31)

### Pie chart composite key (`packages/@ronzz/ronstats-core/src/charts/renderers/pie.ts`)
- Changed from `dp.dimensionValue || dp.dimensionKey` to `[dp.dimensionKey, dp.dimensionValue].filter(Boolean).join(":::")`
- Prevents incorrect grouping when same value appears under different dimensions

### Production-safe error masking (`apps/web/src/lib/server/middleware.ts`)
- `apiHandler()` now returns generic "Internal server error" in production instead of leaking error details

### Trash listing tiebreaker (`ronstats-core`, `ronlib-core`)
- Added `id` as secondary sort to `ORDER BY` for deterministic pagination

### Logger usage (`@ronzz/ronencik-core/src/queries/articles.ts`)
- Replaced `console.error` with `logger.error` in `syncEncikArticles`

## Result
- 153 tests pass (19 files)
- Biome lint clean
- Branch: `fix/round-10-review-fixes`, merged to `main` (commit 62d11d5)
- Issue #30 created and closed
