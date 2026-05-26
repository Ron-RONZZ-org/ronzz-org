# Round 9 Fixes — 2026-05-25

## Summary
Fixed 6 open GitHub issues (#18, #21, #22, #24, #25, #26) addressing deployment, CI/CD, API consistency, infrastructure scripts, flaky tests, and code quality.

## Issues Closed

### #18 — Deployment Infrastructure Blocking
- **C1**: Enabled corepack + pnpm in Docker runner stage
- **C2**: HTTPS Caddyfile with auto-TLS + HTTP redirect
- **C3**: USER node for non-root execution
- **H2**: pnpm prune --prod to remove devDeps from final image
- **H3**: Removed `|| echo` suppression from entrypoint.sh
- **H5**: Optimized Docker layer caching (manifests before source)
- **H6**: Added HEALTHCHECK instruction
- **H7**: Created .dockerignore
- **H12/H14/H15**: Fixed compose networking (ports 80/443), added network, added missing env vars

### #21 — CI/CD Pipeline
- **H8**: Fixed image name typo
- **H9**: Removed redundant CI-level build
- **H10**: Added post-deploy health check with rollback
- **H11**: Docker container cleanup + pg_isready retry loop
- **H39**: Removed --audit-level=critical from pnpm audit

### #22 — API Design Inconsistencies
- **H22**: Added `apiHandler()` wrapper (JSON error responses instead of HTML 500)
- **H23**: Runtime validation on search reindex documents
- **M3**: Math.min() limit caps on all paginated endpoints
- **M4/M5**: Standardized pagination shapes
- **M6**: DELETE → 204 No Content / 404 Not Found

### #24 — Infrastructure Scripts
- **H42**: POSIX-compatible date format in monitoring scripts
- **H43**: Docker Compose auto-discovery for DB container
- **L3**: `|| true` on find -delete

### #25 — Test Coverage (Partial)
- Fixed flaky tests in rate-limiter.test.ts and datapoints.test.ts using `vi.useFakeTimers()`

### #26 — Code Quality
- Most items already addressed in prior commits (H34, H36, M20, M29, L6)
- Verified H40, M17, H32, L1, H44, L2, L7 were already done
- H35 (CRUD duplication) deferred as too large

## Files Modified
34 files changed across the monolith. Key changes:
- `deploy/Dockerfile`, `entrypoint.sh`, `Caddyfile`, `docker-compose.yml`, `.env.example`
- `.github/workflows/ci.yml`, `deploy.yml`
- `apps/web/src/lib/server/middleware.ts` (apiHandler wrapper)
- 8 API route handler files
- `scripts/backup.sh`, `scripts/monitoring/*.sh`
- 2 test files (flakiness fixes)

## Stats
- 152 tests pass (19 files)
- Biome lint clean
- 27 pre-existing type errors remain (d3 declarations, null safety in Svelte pages)
