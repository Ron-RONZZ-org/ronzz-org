/**
 * Dialect-agnostic query execution helpers.
 *
 * SQLite (better-sqlite3) requires explicit `.all()`, `.get()`, `.run()` calls,
 * while PostgreSQL returns thenable promises directly from Drizzle query builders.
 * These helpers abstract away the difference so core packages work on both dialects.
 *
 * IMPORTANT: Uses duck-typing (`typeof q.all === "function"`) instead of
 * `detectDialect()` to prevent Vite/Rollup from evaluating the dialect
 * at build time (DATABASE_URL is undefined during Docker build, causing
 * Rollup to prune the PG branch as dead code and emit direct `.all()` calls).
 */

/**
 * Return a dialect-appropriate current-timestamp value.
 * - PG:      `new Date()` (for `timestamp` columns)
 * - SQLite:  `Date.now()` (for `integer` columns)
 *
 * An optional `offsetMs` adds a duration to the current time
 * (e.g. `dbNow(7 * 24 * 60 * 60 * 1000)` for a 1-week expiry).
 *
 * Uses `process.env["DATABASE_URL"]` with bracket notation to prevent
 * Vite/Rollup from evaluating the check at build time.
 */
export function dbNow(offsetMs?: number): Date | number {
  // biome-ignore lint/complexity/useLiteralKeys: bracket access prevents Rollup constant folding
  const url = process.env["DATABASE_URL"] ?? ""
  const isPg = url.startsWith("postgres") || url.startsWith("postgresql")
  if (isPg) {
    return offsetMs ? new Date(Date.now() + offsetMs) : new Date()
  }
  return offsetMs ? Date.now() + offsetMs : Date.now()
}

/**
 * Execute a `select` query and return all matching rows.
 * - SQLite: await q.all()
 * - PG:     await q
 *
 * Uses duck-typing (typeof q.all) instead of detectDialect() to prevent
 * Rollup from evaluating the dialect at build time.
 */
export async function queryAll<T>(q: unknown): Promise<T[]> {
  if (typeof (q as { all?: () => T[] }).all === "function") {
    return await (q as { all(): T[] }).all()
  }
  return await (q as Promise<T[]>)
}

/**
 * Execute a `select` query and return the first matching row (or undefined).
 * - SQLite: await q.get()
 * - PG:     await q, then extract the first element (PG returns an array)
 *
 * Uses duck-typing (typeof q.get) instead of detectDialect() to prevent
 * Rollup from evaluating the dialect at build time.
 */
export async function queryGet<T>(q: unknown): Promise<T | undefined> {
  if (typeof (q as { get?: () => T | undefined }).get === "function") {
    return await (q as { get(): T | undefined }).get()
  }
  const rows = await (q as Promise<T[]>)
  return rows[0]
}

/**
 * Execute an `insert`, `update`, or `delete` query.
 * Returns a dialect-agnostic result with `.changes` (SQLite) or `.rowCount` (PG).
 * - SQLite: await q.run()
 * - PG:     await q
 *
 * Uses duck-typing (typeof q.run) instead of detectDialect() to prevent
 * Rollup from evaluating the dialect at build time.
 */
export async function queryRun(q: unknown): Promise<{ changes?: number; rowCount?: number }> {
  if (typeof (q as { run?: () => { changes: number } }).run === "function") {
    return await (q as { run(): { changes: number } }).run()
  }
  return await (q as Promise<{ rowCount: number }>)
}
