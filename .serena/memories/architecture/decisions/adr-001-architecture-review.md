# ADR-001: Architectural Design Review (Issue #1)

## Status
Approved with enhancements (2026-05-23)

## Context
Issue #1 proposed the full architectural design for ronzz.org. Ron (owner) approved with answers to open questions. @architect conducted a critical review.

## Key Decisions

### 0. Cross-Cutting: Patterns from A-Projects (see ADR-003)
- **UUID primary keys** on all user-facing tables
- **i18n (fr/eo/en)** — all UI text in French, Esperanto, English via `tr_multi()` pattern
- **JSON metadata columns** — RonEncik articles use JSONB for flexible frontmatter
- **Mandatory test isolation fixture** — all tests redirect paths to tmp
- Soft-delete, runtime detection, .serena conventions noted for later

### 1. Package Scoping
- Use `@ronzz/*` for all packages: `@ronzz/ui`, `@ronzz/ronlib-core`, `@ronzz/ronstats-core`, `@ronzz/ronencik-core`
- Create `@ronzz/search-core` for unified cross-project search logic

### 2. Database Dual Dialect
- Separate schema trees: `database/schema/{sqlite,pg}/`
- **UUID primary keys** on all user-facing tables (`uuid TEXT PRIMARY KEY`) — prevents collision bugs (see ADR-003 §1)
- Abstract full-text search behind an interface (`SearchEngine`) — implementations: `SqliteSearchEngine` (FTS5), `PostgresSearchEngine` (tsvector)
- CI must test against both dialects (GitHub Actions matrix)

### 3. Auth (Lucia v3 + RBAC)
- Lucia v3 is session-management only. User management, password hashing, and RBAC are our responsibility.
- `users` table: `id`, `email`, `password_hash`, `role` (`admin | editor`), `created_at`
- `requireRole(role)` guard function called per-endpoint (not just hooks.server.ts)
- Admin page for creating editor accounts (no self-registration)
- Rate-limit login attempts

### 4. D3.js + Svelte
- **Default pattern**: "D3 for math, Svelte for DOM" — D3 computes scales/shapes, Svelte template renders SVG
- **Reserve `use:action`** for complex D3 data-join scenarios (force-directed graphs, complex Encik animations)
- One `*Chart.svelte` component per chart type (no generic Chart.svelte wrapper)

### 5. Unified Search
- Dedicated denormalized `search_index` table with `type` facet column (`resource | dataset | article`)
- Index updated on: ingestion scripts, admin action, cron job
- Query via `SearchEngine` interface (abstracts SQLite FTS5 / PG tsvector)

### 6. Rendering
- `@sveltejs/adapter-node` for self-hosting (handles both SSG + SSR)
- Encik: `prerender = true`, Lib/Stats: SSR (default)

### 7. i18n (fr/eo/en)
- All user-facing text: French (primary), Esperanto (naming/taxonomy), English (fallback)
- Pattern: `tr_multi(fr, eo, en)` inline for dynamic strings (adopted from A-core)
- Static translations per sub-project (JSON/TS files)
- Locale detection: SvelteKit hooks (`Accept-Language`) + cookie preference
- Default: French

### 8. RonEncik JSON Metadata
- Articles use `metadata JSONB` column for flexible frontmatter (terminology, definitions, semantic links)
- RonLib resources get `metadata JSON` for type-specific fields
- SQLite: TEXT with JSON functions; PostgreSQL: native JSONB with GIN indexes

### 9. Test Isolation (Mandatory)
- Every test suite has an `autouse` fixture redirecting DB/config/cache to `tmp_path`
- `@vi.mock` is for return-value control, NOT isolation
- Tests hitting real databases rejected in review

### 10. Implementation Order (3 Phases)
- **Phase 1**: Monorepo scaffold → Docker → Database schemas → Auth
- **Phase 2**: `@ronzz/search-core` → RonLib → RonStats → RonEncik
- **Phase 3**: D3 charts → Admin UI → CI/CD → Backups/Monitoring/SEO

### 11. Missing Items (to address during implementation)
- Error handling: `Result<T, E>` type for data layer, `throw error()` for SvelteKit routes
- Logging: pino structured JSON, stdout for Docker
- SEO: shared `<svelte:head>` component
- API versioning: `/stats/api/v1/`
- Rate limiting on public API routes
- CSP/Security headers in Caddyfile
- i18n (fr/eo/en) — tr_multi() pattern
- Test isolation — mandatory autouse fixture
- Soft-delete trash pattern (post-v1)
- .serena memory conventions

## Related ADRs
- **ADR-002**: Detailed designs for error handling, logging, SEO, API versioning, rate limiting, CSP
- **ADR-003**: Patterns adopted from A-ecosystem (UUID PKs, i18n, JSON metadata, test isolation)

## Links
- Issue: https://github.com/Ron-RONZZ-org/ronzz-org/issues/1
- Architect evaluation comment: https://github.com/Ron-RONZZ-org/ronzz-org/issues/1#issuecomment-4526129590
