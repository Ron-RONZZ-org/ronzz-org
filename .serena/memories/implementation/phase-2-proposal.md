# Phase 2 (Issue #3) — Architecture Proposal

## Summary
Proposed solution for Issue #3 posted at https://github.com/Ron-RONZZ-org/ronzz-org/issues/3#issuecomment-4526340152

## Key Decisions
- **Token auth**: SHA-256 (not Argon2), Bearer middleware on `/admin/` routes
- **CLI**: remote-only via HTTPS, no direct DB access, uses `yargs`
- **Encik i18n**: three-build SSG (`/fr/encik/`, `/eo/encik/`, `/en/encik/`)
- **Search index**: synchronous update on domain writes (v1); job queue later
- **Middleware**: split `hooks.server.ts` into composable middleware before adding token auth
- **resetDb()**: needed in `database` package for test isolation
- **CSV formats**: document per command before implementation

## Implementation Order
1. Steps 2.1 + 2.2 + 2.7 in parallel (foundation)
2. Step 2.4 (RonLib)
3. Step 2.5 (RonStats)
4. Step 2.6 (RonEncik)
5. Step 2.3 (CLI)

## New Packages
- `@ronzz/search-core` — SearchEngine interface + FTS5/tsvector implementations
- `@ronzz/cli` — yargs-based CLI tool
- `@ronzz/ronlib-core` — Resource management domain
- `@ronzz/ronstats-core` — Dataset/datapoint domain
- `@ronzz/ronencik-core` — Article metadata domain
