# Phase 3 — Polish Implementation Proposal

## Source
GitHub Issue #4: https://github.com/Ron-RONZZ-org/ronzz-org/issues/4
Architect consultation completed 2026-05-24.

## Summary
Phase 3 covers 7 sub-tasks: D3.js charts, CI/CD pipeline, monitoring, backup, SEO, security hardening, soft-delete CLI.

## Architecture Decisions

### 3.1 D3.js Charts
- **D3 renderers** (pure functions): `@ronzz/ronstats-core/src/charts/renderers/{line,bar,pie}.ts`
- **Svelte components**: `@ronzz/ui/src/charts/{LineChart,BarChart,PieChart}.svelte`
- **Subpath export**: `@ronzz/ronstats-core/package.json` exports `"./charts"` to isolate D3 deps from server bundles
- **Schema**: Add `chart_type` enum column (`"line" | "bar" | "pie"`) to datasets (both dialects)
- **ResizeObserver** in `onMount` for responsive SVG width

### 3.2 CI/CD
- **Separate `deploy.yml`** (leave `ci.yml` untouched)
- **Docker tag**: Git SHA (`${{ github.sha }}`) + `:latest`
- **Health**: New top-level `GET /api/v1/health` with DB ping; keep old as redirect
- **pnpm audit**: Add to `ci.yml` lint job, fail on critical

### 3.3 Monitoring
- **Shell scripts** (not Node.js): health-check, disk-usage, alert
- **Systemd timers** for periodic checks
- Alert logs to `/var/log/ronzz/` initially

### 3.4 Backup
- **Host cron** → `docker exec` pg_dump (not in app container)
- Daily 03:00, retain 30 days
- No off-site backup in Phase 3 (future)

### 3.5 SEO
- **Sitemap**: Dynamic `routes/sitemap.xml/+server.ts`
- **RSS**: `routes/lib/feed.xml/+server.ts` (resources table)
- **JSON-LD**: Extend `Seo.svelte` with `jsonld` + `canonical` props; helpers in `@ronzz/shared-core/src/seo/`
- **Canonical URLs**: From page load functions

### 3.6 Security
- **Nonce CSP**: Generate in `hooks.server.ts`, pass to `resolve(event, { nonce })`, set header on response
- Move CSP from Caddy to SvelteKit (keep other headers in Caddy)
- **HSTS**: Add to Caddy
- **Rate-limit**: Granular config (login: 5/60s, search: 30/60s, API: 60/60s, default: 120/60s)

### 3.7 Soft-Delete CLI
- **Schema**: Add nullable `deleted_at` to resources, datasets, articles_metadata (both dialects)
- **Queries**: Convert to soft-delete; add trash/restore/hard-delete
- **CLI**: Add `trash`, `restore`, `purge` subcommands
- **Dual-dialect**: PG query files alongside SQLite (matches schema pattern)

## Implementation Order
1. Schema changes (soft-delete + chart_type) — foundation
2. Security hardening — safety-critical
3. SEO quick wins (canonical, JSON-LD)
4. D3.js charts — most visible feature
5. Soft-delete CLI — depends on schema
6. Sitemap + RSS
7. CI/CD deploy pipeline
8. Monitoring scripts
9. Backup automation

## Key Constraints
- No `@apply` in Svelte `<style>` blocks
- D3.js for all charts
- Dual dialect DB schemas
- Files < 500 lines
- Vitest for tests
- Biome strict (no semicolons, double quotes)
- AGPL v3 compliance
- UUID PKs for user-facing tables
