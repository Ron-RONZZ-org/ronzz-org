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
│   ├── hooks.server.ts  # Logging, rate limiting, session + token auth, nonce CSP, locale detection
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
│   ├── db.ts                   # getDb() — dual-dialect factory (closeDb, resetDb)
│   ├── db-types.ts             # Database union type (SQLite | PG)
│   ├── seeds/admin-user.ts     # admin@ronzz.org (ADMIN_PASSWORD env var)
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
│   │   └── rate-limiter.test.ts
│   └── database/               # Future DB tests
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
9. CSP is nonce-based, generated in `hooks.server.ts` — do not set CSP in Caddy's static config
10. Health endpoint lives at `GET /api/v1/health` (top-level), old route at `/stats/api/v1/health` kept for compat
11. **Chunked body TOCTOU guard**: When buffering chunked request bodies in `hooks.server.ts`, check each chunk size (max 64 KB) BEFORE pushing to the buffer array to prevent a single oversized chunk from bypassing the total size check
12. **better-sqlite3 transactions are sync**: Drizzle's better-sqlite3 adapter wraps synchronous calls in Promises, but `db.transaction()` callbacks MUST be synchronous (no `async`/`await` inside). PostgreSQL transactions support async callbacks.

---

## Key Contacts

- **Author**: Ron (France, European Union)
- **License**: AGPL v3 — all source code must be available to network users
