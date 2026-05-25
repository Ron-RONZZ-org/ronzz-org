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
│   ├── db.ts                   # getDb() — dual-dialect factory (closeDb, resetDb); uses detectDialect from proxy.ts
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
│   │   └── middleware.test.ts   # Session + token auth validation
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
│   ├── ronstats-core/
│   │   ├── datasets.test.ts     # Dataset CRUD + trash/restore/purge
│   │   └── datapoints.test.ts   # Datapoint CRUD + ordering + pagination
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
- **PG timestamp values**: Use `new Date()` for `timestamp` columns, `Date.now()` for `integer` columns — check `process.env.DATABASE_URL` prefix to branch between dialects
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

---

## Key Contacts

- **Author**: Ron (France, European Union)
- **License**: AGPL v3 — all source code must be available to network users
