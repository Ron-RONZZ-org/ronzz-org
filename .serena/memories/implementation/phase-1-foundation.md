# Phase 1 — Foundation Implementation Notes

## Summary
Phase 1 (Issue #2) was implemented on 2026-05-23. The full structure is now on `main`.

## Key Implementation Decisions

### Tailwind v4
- Tailwind CSS v4 requires `@tailwindcss/postcss` (separate package from `tailwindcss`)
- `@apply` is NOT compatible with Svelte `<style>` blocks in v4. Use inline utility classes instead.
- The `@import "tailwindcss"` directive in `app.css` loads the theme

### Dual Dialect Database
- `getDb()` returns a union type (SQLite | PG) which causes TypeScript issues
- Workaround: cast `as BetterSQLite3Database<typeof sqliteSchema>` in routes
- Future: add proper overloads or separate getters

### Auth (Phase 1)
- Simplified session auth: cookie-based, argon2id hashing, direct SQL for session storage
- NOT Lucia v3 — will be replaced in a future phase
- Login rate-limited at 5/min per IP

### Build Artifacts
- `apps/web/build/` should be in `.gitignore` (added post-commit)
- Build was accidentally committed and pushed. Harmless but untracked now.

### SvelteKit Prerender
- `/encik` route uses `export const prerender = true`
- Server load functions (`+layout.server.ts`) need try-catch for prerender context
- Universal `+layout.ts` provides fallback: `data?.locale ?? "fr"`

## File Size Compliance
All files kept under 500 lines. No monoliths.

## Verification
- `pnpm lint` passes
- `pnpm --filter @ronzz/web exec svelte-check` — 0 errors, 38 warnings (all Tailwind CSS warnings)
- `pnpm test` — 13/13 pass
- `pnpm --filter @ronzz/web build` — succeeds
- `pnpm db:migrate:sqlite` + `pnpm db:seed` — work
