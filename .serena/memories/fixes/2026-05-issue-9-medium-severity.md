# Issue #9 — Medium Severity Fixes (2026-05-24)

## Summary
Five medium-severity issues from code review. All resolved in PR #11.

## Changes

### 1. Duplicate devDependencies (ronstats-core/package.json)
- Merged two `devDependencies` blocks into one.
- `@types/d3` was silently overridden by the second block.

### 2. Chart ResizeObserver duplication
- Extracted `packages/@ronzz/ui/src/charts/useContainerWidth.svelte.ts`
- Svelte 5 rune composable using getter/setter + `$state()` + `$effect()`
- Applied to LineChart, BarChart, PieChart

### 3. createDataset/createResource shape reconstruction
- Switched from `.values(...).run()` + manual return object to `.values(...).returning().all()`
- Drizzle's `.returning()` returns the inserted row directly

### 4. Search engine instantiation
- `engine.ts`: Module-level cache for both `createSearchEngine()` and `detectDialect()`
- `db` is already a singleton, so engine instance caching is safe

### 5. Result<T,E> adoption (Phase 1: mutations)
- New `tryResult(fn, errorMapper?)` utility in `packages/@ronzz/shared-core/src/result-utils.ts`
- Mutation functions now return `Result<Dataset, AppError>` / `Result<Resource, AppError>`
- Route handlers unwrap with `if (!result.ok) return json({ error: ... }, { status: ... })`
- Fixed latent bug: hardDeleteDataset + restoreDataset handlers were missing `await`
- Tests updated to unwrap Result objects

## Files Modified
- `packages/@ronzz/ronstats-core/package.json` — duplicate deps fix
- `packages/@ronzz/search-core/src/engine.ts` — engine caching
- `packages/@ronzz/ui/src/charts/useContainerWidth.svelte.ts` — new composable
- `packages/@ronzz/ui/src/charts/{Line,Bar,Pie}Chart.svelte` — use composable
- `packages/@ronzz/shared-core/src/result-utils.ts` — new tryResult utility
- `packages/@ronzz/shared-core/src/index.ts` — export tryResult
- `packages/@ronzz/ronstats-core/src/queries/datasets.ts` — .returning() + Result
- `packages/@ronzz/ronlib-core/src/queries/resources.ts` — .returning() + Result
- 5 route handler files — unwrap Result
- `tests/shared-core/result.test.ts` — 4 new tests for tryResult
- 2 test files — unwrap Result objects
- `AGENTS.md` — updated shared-core description
