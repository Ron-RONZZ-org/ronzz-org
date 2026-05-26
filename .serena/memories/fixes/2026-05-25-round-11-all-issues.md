# Round 11 — Code Review Fixes (2026-05-25)

## Summary
Addressed 14 findings from comprehensive code review. Fixed all critical, high, and medium severity issues.

## Changes

### Critical
- **C1**: `deploy/Dockerfile` — removed `--prod` from `pnpm install` (was blocking build by omitting devDependencies)
- **C2**: `.github/workflows/deploy.yml` — fixed rollback to `docker tag ...:ROLLBACK_TAG ...:latest` then `docker compose up -d` instead of passing image as positional arg
- **C3**: `packages/@ronzz/cli/src/index.ts` — added `await` to `yargs.parse()` + `.catch()` handler
- **C4**: `deploy/entrypoint.sh` — replaced fragile `sed` URL parsing with `node -e` proper URL parsing

### High Severity
- **H1**: Created `database/dialect-query.ts` — dialect-agnostic `queryAll<T>()`, `queryGet<T>()`, `queryRun()` helpers replacing SQLite-specific `.all()`, `.get()`, `.run()` across 5 core files (~30 call sites)
- **H2**: `packages/@ronzz/ui/src/Seo.svelte` — changed `{JSON.stringify(jsonld)}` to `{@html JSON.stringify(jsonld)}` for valid JSON-LD
- **H3**: Added `escapeLike()` to datasets.ts and resources.ts — escapes `%` and `_` with backslash in user search terms
- **H4**: `packages/@ronzz/cli/package.json` — moved `tsx` from devDependencies to dependencies, changed shebang to `#!/usr/bin/env tsx`

### Medium Severity
- **M2**: Wrapped 2 search endpoints with `apiHandler()` wrapper
- **M3**: Added `isNaN` guard to Content-Length check in hooks.server.ts
- **M4**: Wrapped rate limiter call in try/catch in hooks.server.ts
- **M5**: Added search engine indexing to admin createDataset route
- **M7**: Changed `t()` to use `.replaceAll()` for multi-occurrence template variables
- **M8**: TTL cache eviction now scans for expired entries before evicting oldest

### Conventions Added to AGENTS.md
Rules 32-38: dialect-query, escapeLike, JSON-LD @html, t() replaceAll, TTL eviction, CLI tsx dep, Docker build without --prod

## Verification
- 153 tests pass (19 files)
- Biome lint clean
- 27 pre-existing type errors unchanged
- Branch: `fix/review-round-11-all-issues`, merged via PR #32
- Issue #31 created and closed
