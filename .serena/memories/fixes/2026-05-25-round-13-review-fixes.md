# Round 13 Review Fixes — May 25, 2026

## Summary
Addressed findings from a comprehensive codebase review covering critical Dockerfile bug, code deduplication, monitoring improvements, and env-based configuration.

## Changes

### Critical
- **Dockerfile** (`deploy/Dockerfile`): Moved `pnpm prune --prod` to after `pnpm build` (was stripping devDependencies needed for build). Removed `2>/dev/null || true` silencing from database build step.

### Monitoring
- **health-check.sh** (`scripts/monitoring/health-check.sh`): Added `mkdir -p /var/log/ronzz` before writing log, matching pattern used by other monitoring scripts.

### Code Deduplication
- **escapeXml**: Extracted from inline duplicates in `feed.xml/+server.ts` and `sitemap.xml/+server.ts` into shared `@ronzz/shared-core` (`src/escape-xml.ts`) with full test coverage (`tests/shared-core/escape-xml.test.ts`).
- **isValidLocale**: Replaced inline function in `search/index/+server.ts` with `toLocale()` from `@ronzz/shared-core`.

### Env Configuration
- **feed.xml / sitemap.xml**: Changed `BASE` from hardcoded `"https://ronzz.org"` to `process.env.ORIGIN || "https://ronzz.org"`.

### Robustness
- **feed.xml**: Added `formatPubDate()` wrapper with try/catch for safe date parsing, preventing RSS feed 500 errors on invalid dates.

### Documentation
- **AGENTS.md**: Added item 40 documenting `escapeXml()` import convention.

## Related
- Issue #34 (created and closed)
- PR #35 (merged to main)
