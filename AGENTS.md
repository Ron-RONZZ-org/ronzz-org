# Ronzz.org — Project Guide for AI Agents

## Project Overview

**ronzz.org** is a personal website with three sub-projects:
- **RonLib** — Searchable metadata catalog of resources (books, videos, podcasts, articles, etc.)
- **RonStats** — Free/libre statistics aggregation platform with API access
- **RonEncik** — Animated, graphic-rich encyclopedia on big ideas

Licensed under **GNU AGPL v3**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **SvelteKit** (TypeScript, adapter-node) |
| Rendering | Hybrid (SSG for RonEncik, SSR for RonLib/RonStats) |
| Database | **SQLite** (dev) / **PostgreSQL** (prod) via **Drizzle ORM** |
| Charts | **D3.js** (renderers in `@ronzz/ronstats-core/charts`, components in `@ronzz/ui`) |
| Content | **Markdown** via mdsvex |
| Package manager | **pnpm** (workspaces monorepo) |
| CSS | **Tailwind CSS v4** |
| Linting | **Biome** (strict, no semicolons, double quotes) |
| Testing | **Vitest** |
| Auth | Session-based (cookies) with Argon2id; Lucia v3 planned |
| Deployment | **Self-hosted** — Ubuntu, 12 GB RAM, Docker Compose + Caddy |

---

## Project Structure

```
ronzz-org/
├── apps/
│   └── web/                    # SvelteKit application
│       ├── svelte.config.js
│       ├── vite.config.ts
│       └── src/
│           ├── app.html
│           ├── app.d.ts
│   ├── hooks.server.ts  # Logging, rate limiting, CSRF, session + token auth, nonce CSP, locale detection
│           ├── hooks.client.ts
│           └── routes/
│               ├── +layout.svelte     # Root layout (Nav + Footer, canonical URLs, JSON-LD)
│               ├── +layout.ts         # Universal load (locale fallback)
│               ├── +layout.server.ts  # Server load (locale from headers)
│               ├── +page.svelte       # Landing page
│               ├── api/v1/health/     # Health endpoint (top-level)
│               ├── sitemap.xml/       # Dynamic sitemap
│               ├── lib/
│               │   ├── +page.svelte   # RonLib search/catalog
│               │   ├── feed.xml/      # RSS feed
│               │   ├── login/
│               │   │   ├── +page.svelte     # Login form
│               │   │   └── +page.server.ts  # Login form action
│               │   ├── change-password/
│               │   │   └── +page.server.ts  # Password change (session-bound pw_reset cookie)
│               │   └── logout/
│               │       └── +server.ts       # POST logout
│               ├── stats/
│               │   ├── +layout.svelte         # RonStats layout
│               │   ├── +page.svelte           # RonStats search/catalog
│               │   ├── [uuid]/
│               │   │   ├── +page.svelte       # Dataset detail + chart
│               │   │   └── +page.server.ts
│               │   └── api/v1/
│               │       ├── health/            # Legacy health endpoint
│               │       ├── datasets/
│               │       └── admin/datasets/    # Admin CRUD + trash/restore/purge
│               └── encik/
│                   ├── +layout.ts    # export const prerender = true
│                   ├── +layout.svelte
│                   └── +page.svelte  # RonEncik placeholder
├── packages/
│   ├── @ronzz/shared-core/     # Result<T,E>, tryResult(), AppError, logger, rate-limiter (closeRateLimiter), i18n (toLocale), TtlCache, JSON-LD helpers
│   ├── @ronzz/ronstats-core/   # Dataset/datapoint queries, validation, D3 chart renderers
│   ├── @ronzz/ui/              # Seo, Button, Card, Nav, Footer, LineChart, BarChart, PieChart, app.css
│   ├── @ronzz/cli/             # CLI tool (yargs) — token, user, resource, dataset, article, search + trash/restore/purge
│   ├── @ronzz/search-core/     # Search indexing
│   ├── @ronzz/ronlib-core/     # Resource queries
│   ├── @ronzz/ronencik-core/   # Article queries
├── database/
│   ├── schema/
│   │   ├── sqlite/             # SQLite dialect (9 tables)
│   │   └── pg/                 # PostgreSQL dialect (9 tables)
│   ├── dialect-query.ts        # Dialect-agnostic query helpers — queryAll(), queryGet(), queryRun()
│   ├── schema/proxy.ts         # Lazy schema resolution via Proxy — getSchema(), schema (lazy), resetDialectCache(), detectDialect()
│   ├── db-types.ts             # Database union type (SQLite | PG)
│   ├── seeds/admin-user.ts     # admin@ronzz.org (ADMIN_PASSWORD env var, required — no fallback)
│   └── drizzle.config.*.ts     # SQLite + PG Drizzle kit configs
├── deploy/
│   ├── Dockerfile              # Multi-stage build
│   ├── docker-compose.yml      # App + PostgreSQL 16 + Caddy 2
│   ├── Caddyfile               # Reverse proxy + HSTS + security headers (CSP in SvelteKit)
│   ├── entrypoint.sh           # Wait for PG, migrate, seed, start
│   └── .env.example
├── scripts/
│   ├── backup.sh               # pg_dump via docker exec
│   └── monitoring/
│       ├── alert.sh            # Shared alert logging
│       ├── health-check.sh     # Curl health endpoint
│       └── disk-usage.sh       # df alert on >90%
├── tests/
│   ├── setup.ts                # beforeEach isolation fixture
│   ├── auth/
│   │   ├── middleware.test.ts   # Session + token auth validation
│   │   └── csrf-origin.test.ts  # CSRF origin matching tests
│   ├── shared-core/
│   │   ├── result.test.ts  
│   │   ├── result-utils.test.ts
│   │   ├── i18n.test.ts
│   │   ├── rate-limiter.test.ts
│   │   └── ttl-cache.test.ts
│   ├── validation/
│   │   ├── ronstats-core.test.ts
│   │   ├── ronlib-core.test.ts
│   │   └── ronencik-core.test.ts
│   ├── charts/
│   │   ├── bar.test.ts
│   │   ├── line.test.ts
│   │   └── pie.test.ts
│   ├── database/
│   │   └── schema-proxy.test.ts # Schema proxy lazy resolution tests (detectDialect, getSchema, resetDialectCache)
│   ├── search-core/
│   │   ├── sqlite-engine.test.ts # SQLite search engine tests
│   │   └── pg-engine.test.ts    # PostgreSQL search engine tests (mocked)
│   ├── routes/
│   │   ├── health.test.ts       # Health endpoint handler tests
│   │   ├── datasets-api.test.ts # Dataset API route handler tests
│   │   ├── datapoints-api.test.ts # Datapoint API route handler tests
│   │   └── admin-api.test.ts    # Admin API route handler tests
│   ├── ronstats-core/
│   │   ├── datasets.test.ts     # Dataset CRUD + trash/restore/purge (via getDb())
│   │   └── datapoints.test.ts   # Datapoint CRUD + ordering + pagination (via getDb())
│   ├── helpers/
│   │   ├── create-test-tables.ts # Shared SQLite table creation for test isolation
│   │   └── mock-event.ts        # Shared SvelteKit RequestEvent factory for route handler tests
├── .github/workflows/
│   ├── ci.yml                  # lint, type-check, test (sqlite+pg), build, audit
│   └── deploy.yml              # Build Docker → push ghcr.io → SSH deploy on main push
├── biome.json                  # Strict, no semicolons, double quotes
├── tailwind.config.ts
├── postcss.config.js
└── vitest.config.ts
```

---

## Coding Conventions

1. **Language**: TypeScript (strict mode)
2. **Naming**: Plain English for variables, functions, comments
3. **File size**: Keep under 500 lines; split into functional units if exceeded
4. **Functions**: Single responsibility, sensibly named, comprehensible without comments
5. **Imports**: Native ES module imports; no `require()`
6. **Error handling**: `Result<T, E>` for data layer, `throw error()` for routes
7. **Testing**: Vitest for unit tests; isolation via `beforeEach` fixture
8. **CSS**: Inline Tailwind utility classes (no `@apply` — Tailwind v4 incompatibility)
9. **No `@apply`**: Use inline utility classes in HTML/JSX instead of `@apply` in `<style>` blocks

## Database Conventions

- **Dual dialect**: Separate schema trees in `database/schema/{sqlite,pg}/`
- **UUID PKs**: All user-facing tables use `text("id").primaryKey()` with app-generated UUIDs
- **Soft-delete**: Tables with `deleted_at` (nullable) — resources, datasets, articles_metadata
- **Migrations**: `pnpm db:migrate:sqlite` / `pnpm db:migrate:pg`
- **Seeds**: Run via `pnpm db:seed`
- **Test isolation**: `DATABASE_URL=:memory:` via `beforeEach` fixture
- **PG timestamp values**: Use `dbNow()` from `database/dialect-query` for dialect-appropriate timestamps — `new Date()` for `timestamp` columns (PG), `Date.now()` for `integer` columns (SQLite). Accepts optional `offsetMs`. Never duplicate the `detectDialect()` branching manually.
- **Drizzle `.run()` results**: SQLite returns `{ changes }`, PG returns `{ rowCount }` — use `(result.changes ?? result.rowCount ?? 0) > 0` for dialect-agnostic checks

## Git Workflow

- **Branch from `main`** for all work
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`
- Each commit addresses one concern; no mixed changes
- Reference GitHub issues: `feat(lib): add resource search (#2)`

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start SvelteKit dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run all Vitest tests |
| `pnpm lint` | Biome check |
| `pnpm check` | svelte-check |
| `pnpm db:migrate:sqlite` | Apply SQLite migrations |
| `pnpm db:migrate:pg` | Apply PG migrations |
| `pnpm db:seed` | Seed admin user |
| `pnpm cli` | Run CLI tool (resource, dataset, article, token, user, search) |

## Agent Instructions

1. Always read AGENTS.md and relevant memories first
2. For architecture-level decisions, consult @architect
3. Keep files < 500 lines; split if needed
4. Write tests for new logic; ensure existing tests pass
5. Prefer file-based content (Markdown/YAML) for RonEncik and RonLib seeds
6. Use D3.js for all chart visualizations in RonStats
7. Ensure AGPL v3 compliance — source link in footer of every page
8. Do NOT use `@apply` in Svelte `<style>` blocks (Tailwind v4 limitation); use inline utility classes instead
9. CSP is nonce-based, generated in `hooks.server.ts` — do not set CSP in Caddy's static config; nonce uses 128-bit entropy via `randomBytes(16).toString("hex")`
10. CSRF protection is applied in `hooks.server.ts` — state-changing requests without matching Origin/Referer are rejected; Bearer-authenticated API calls bypass this check; requests with session cookies MUST have Origin or Referer
11. Health endpoint lives at `GET /api/v1/health` (top-level), old route at `/stats/api/v1/health` kept for compat
12. Schema proxy in `database/schema/proxy.ts` uses lazy evaluation via Proxy — `resetDialectCache()` forces re-evaluation on next access, critical for test isolation
13. `detectDialect()` from `database/schema/proxy.ts` is the single source of truth for dialect detection — do not reimplement it elsewhere (search-core already imports it)
14. Logout deletes the session server-side from the DB in addition to clearing the cookie
15. Change-password endpoint is rate-limited (5 attempts/min per pw_reset hash + IP)
16. Datapoints are returned in descending order by `createdAt` for deterministic chart rendering
17. Use `biome-ignore` comments (not `eslint-disable`) for intentional suppressions
18. Admin API route handlers MUST use `requireAdmin(locals)` from `$lib/server/middleware` — checking only `!locals.user` is insufficient; role must be `"admin"`
19. CSRF origin matching MUST use exact hostname+port comparison (`isOriginAllowed()` in `hooks.server.ts`), NOT `startsWith()` to prevent subdomain bypass attacks
20. Chart renderers MUST use `reduce()` instead of `Math.max(...spread)` to avoid stack overflow on large datasets
21. `createDataset` MUST NOT use `.returning()` (SQLite incompatible); construct the return value manually (same pattern as `createDatapoint`)
22. The `<html lang>` attribute MUST be set dynamically from page locale data (via `$effect` in root layout), not from `%sveltekit.lang%` which is not a valid placeholder
23. API route handlers MUST use `apiHandler()` wrapper from `$lib/server/middleware` for JSON error handling; unhandled exceptions in raw handlers return HTML 500 pages
24. Paginated API endpoints MUST cap `limit` with `Math.min()` — use named constants `MAX_LIMIT`, `DEFAULT_LIMIT` at the top of each route file
25. Successful DELETE endpoints return `204 No Content`, not `200 { deleted: true }`; 404 for not-found
26. Monitoring scripts MUST use POSIX-compatible `date -u +"%Y-%m-%dT%H:%M:%S%z"` instead of GNU-only `date -Iseconds` for Alpine/BusyBox compatibility
27. Test code MUST use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` instead of real `setTimeout()` to avoid flakiness
28. Pie chart label keys MUST use composite keys (`dimensionKey:::dimensionValue`) via `.filter(Boolean).join(":::")` to prevent incorrect grouping when the same value appears under different dimensions
29. `apiHandler()` in production (`NODE_ENV === "production"`) MUST return a generic `"Internal server error"` message instead of leaking error details to clients
30. Trash listing queries (soft-deleted records) MUST include `id` as a tiebreaker in `ORDER BY` (e.g., `orderBy(desc(deletedAt), desc(id))`) for deterministic pagination
31. Dialect detection MUST always use `detectDialect()` from `database/schema/proxy` — never reimplement it with raw `process.env.DATABASE_URL` checks
32. Core query files MUST use `queryAll<T>()`, `queryGet<T>()`, `queryRun()` from `database/dialect-query` instead of SQLite-specific `.all()`, `.get()`, `.run()` — these helpers abstract the dialect difference and work on both SQLite and PostgreSQL
33. User-provided search terms MUST be escaped with `escapeLike()` (escape `%` and `_` with backslash) before using in SQL LIKE patterns to prevent LIKE wildcard injection — `escapeLike()` escapes backslash FIRST, THEN `%` and `_`, so user input like `\%` is treated as literal backslash + literal percent (not escaped backslash + wildcard percent)
34. JSON-LD in Svelte `<script type="application/ld+json">` MUST use `{@html JSON.stringify(jsonld)}` — `{JSON.stringify()}` produces HTML-escaped output (`&quot;`) that breaks structured data
35. `t()` template variable replacement MUST use `.replaceAll()` not `.replace()` — `String.replace()` with a string argument only replaces the first occurrence
36. TTL cache eviction MUST scan for expired entries before evicting the oldest (first-inserted) entry when at capacity
37. CLI `bin` entries MUST use `#!/usr/bin/env tsx` shebang when pointing to `.ts` files, and `tsx` MUST be a runtime `dependency` (not `devDependency`)
38. Docker build stage MUST run `pnpm install` without `--prod` (devDependencies needed for build), then prune with `pnpm prune --prod` after build
39. `escapeLike()` MUST be imported from `@ronzz/shared-core` (`import { escapeLike } from "@ronzz/shared-core"`) — do not duplicate the function in individual query files
40. `escapeXml()` MUST be imported from `@ronzz/shared-core` (`import { escapeXml } from "@ronzz/shared-core"`) — do not duplicate the function in feed/sitemap or other files producing XML output
41. `queryGet()` from `database/dialect-query` MUST extract `[0]` from PG array results (`const rows = await (q as Promise<T[]>); return rows[0]`) since PG `SELECT` queries return arrays, not single rows
42. Search engine singleton (`_engine` in `engine.ts`) MUST track the dialect via `_engineDialect` and re-initialize when `detectDialect()` returns a different value (handles DB reset/reconnect)
43. Login form actions MUST wrap DB operations in try/catch and return `fail(500, { message })` on error — unhandled exceptions return HTML 500 pages instead of JSON
44. Request body size limits MUST handle chunked transfer encoding (`transfer-encoding: chunked`) by buffering the body stream and replacing `event.request` with a new `Request` containing the buffered body — otherwise downstream parsers lose access to the body. **Per-chunk TOCTOU guard**: Check each chunk size (max 64 KB) BEFORE pushing to the buffer array to prevent a single oversized chunk from bypassing the total size check.
45. Critical env vars (`ORIGIN`, `ADMIN_PASSWORD`) MUST be validated at startup via `validateEnv()` called at module load in `hooks.server.ts` — throw on missing values in production (CSRF would silently block requests without ORIGIN)
46. Route handler tests in `tests/routes/` MUST use `$lib` alias defined in `vitest.config.ts` (`$lib` → `apps/web/src/lib`) and import handlers via `$lib/../routes/<path>/+server.ts` path
47. All route handler tests MUST create a minimal mock event object with at minimum `request`, `url`, `params`, `locals`, and `cookies` fields matching the shape used by the handler under test
48. Core query tests (datasets, datapoints, resources, articles) MUST use `getDb()` from `database/db` instead of creating their own SQLite connections — ensures the actual `database/schema/proxy` and `database/db` code paths are exercised
49. Bulk import endpoints MUST enforce a maximum batch size (e.g., `DATAPOINT_BULK_MAX = 5000`) to prevent memory exhaustion from oversized requests
50. Use global `crypto.randomUUID()` (Web Crypto API, available in Node.js 20+) instead of importing `{ randomUUID }` from `node:crypto` — no import needed and consistent with the rest of the codebase
51. `validateEnv()` MUST throw in production (not just warn) when `ORIGIN` is missing — missing ORIGIN makes CSRF protection silently block all legitimate requests
52. Shared test helpers in `tests/helpers/` (`create-test-tables.ts`, `mock-event.ts`) MUST be used by test files instead of duplicating table creation or mock event logic — ensures consistency and reduces maintenance burden
53. Pagination edge cases MUST be tested thoroughly: negative pages, zero pages, NaN inputs, floats, very large numbers, base-10 radix parsing — NaN from `parseInt` on empty/malformed input MUST be guarded with `Number.isFinite(raw) && raw > 0 ? raw : 1` (not just `Math.max(1, raw)` which returns NaN)
54. Null-safety patterns in Svelte components MUST be tested: optional property access (`{#if data.resource.url}`), empty array handling, null coalescing fallbacks (`??`), and type-safe data structures for all page loads — detail pages MUST throw 404 for missing resources rather than rendering with undefined data

55. All form action `redirect()` calls MUST be placed **outside** the try/catch block — SvelteKit's `redirect()` throws a `Redirect` exception that is caught by catch blocks, silently breaking redirects. Variables needed for redirect decisions (e.g., `passwordChangeRequired`, `sessionHash`) MUST be declared before the try block and assigned within it, with redirects following after the try/catch

56. Timestamp branching for dialect compatibility MUST use `dbNow()` from `database/dialect-query` (`import { dbNow } from "database/dialect-query"`) instead of repeating `detectDialect() === "pg" ? new Date() : Date.now()` — this avoids code duplication and ensures consistent behaviour across all call sites. `dbNow()` accepts an optional `offsetMs` parameter for expiry values (e.g. `dbNow(7 * 24 * 60 * 60 * 1000)`)

57. Locale switching in the Nav component MUST use `goto(currentPath, { invalidateAll: true })` to ensure server-side load functions re-execute with the new locale cookie — `goto(currentPath)` without `invalidateAll` performs a client-side navigation that skips server load functions

58. Svelte (`.svelte`) files are excluded from Biome linting (`biome.json` `files.ignore` includes `"*.svelte"`) — Biome v1.9 panics on Svelte 5 rune syntax. Svelte files are linted by `svelte-check` instead (`pnpm check`). Do NOT add `// biome-ignore` comments to Svelte files.

59. Test files (`tests/`) have relaxed Biome rules configured via `linter.overrides` in `biome.json` — `noExplicitAny`, `noNonNullAssertion`, `noUnusedVariables`, and `noForEach` are disabled for test code. Use `// biome-ignore` comments in source (non-test) files for intentional suppressions instead.

60. **better-sqlite3 transactions are sync**: Drizzle's better-sqlite3 adapter wraps synchronous calls in Promises, but `db.transaction()` callbacks MUST be synchronous (no `async`/`await` inside). PostgreSQL transactions support async callbacks.

---

## Key Contacts

- **Author**: Ron (France, European Union)
- **License**: AGPL v3 — all source code must be available to network users
