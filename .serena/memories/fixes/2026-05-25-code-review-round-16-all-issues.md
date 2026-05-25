# Round 16 Code Review Fixes — May 25, 2026

## Summary
Addressed all findings from @reviewer comprehensive code review. 21 files changed, +277/-123 lines.

## High-Severity Fixes

### H1: Inconsistent Number() vs parseInt()
**Files**: `datapoints/+server.ts`, `trash/+server.ts`
**Fix**: Replaced `Number()` with `parseInt(..., 10)` for consistency with 8 other routes.

### H2: escapeLike() backslash escaping bug
**File**: `packages/@ronzz/shared-core/src/escape-like.ts`
**Problem**: `term.replace(/[%_]/g, "\\$&")` didn't escape `\` first. Input `\%` produced SQL LIKE `\\%` (literal backslash + wildcard percent), not literal backslash + literal percent.
**Fix**: Changed to `term.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")` — escape backslash first, then wildcards.

## Medium-Severity Fixes

### M1: svelte-check 8 errors → 0
- Installed `@types/d3` (had been listed in package.json devDeps but not actually installed by pnpm)
- Fixed `defaultDimensions(width = 600)` → `defaultDimensions(width = 600, height = 400)` to accept the `height` parameter that chart components were passing
- Added explicit `as string` / `as number` type casts for all `SearchResult` fields in `search-engine-impl.ts` (row data is `Record<string, unknown>` from `queryAll`)

### M2: Stale nested directory removed
**Path**: `ronzz-org/ronzz-org/` (4.6 MB, dated May 23)
**Fix**: `rm -rf`

## Low-Severity Fixes

### L1: Svelte 5 `state_referenced_locally` warnings (13 → 0)
- **9 page components**: `const locale = data.locale` → `let locale = $derived(data.locale)`
- **3 chart components**: `useContainerWidth(explicitWidth)` → `useContainerWidth(() => explicitWidth)`
- **useContainerWidth**: Refactored to accept `number | (() => number | undefined)` and track via `$effect`
- **Root page**: `const projects = [...]` → `let projects = $derived([...])`

### L2: a11y ignore cleanup
**File**: `Seo.svelte`
**Fix**: Removed obsolete `<!-- svelte-ignore a11y_svg_title -->` comment (code not recognised in Svelte 5)

### L4: Datapoint POST auth model
**Assessment**: Intentional design — any authenticated user can contribute datapoints; admin role required only for CRUD operations on datasets themselves.

## Verification
- ✅ 241 tests passing (28 files)
- ✅ svelte-check: 0 errors, 0 warnings
- ✅ Biome: clean
- ✅ github issue #38 created and closed
- ✅ Branch: `fix/code-review-may-25-issues` → merged to `main`
