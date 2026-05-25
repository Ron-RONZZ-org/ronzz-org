/**
 * Dialect-agnostic query execution helpers.
 *
 * SQLite (better-sqlite3) requires explicit `.all()`, `.get()`, `.run()` calls,
 * while PostgreSQL returns thenable promises directly from Drizzle query builders.
 * These helpers abstract away the difference so core packages work on both dialects.
 */

import { detectDialect } from "./schema/proxy"

type Dialect = ReturnType<typeof detectDialect>

/**
 * Return a dialect-appropriate current-timestamp value.
 * - PG:      `new Date()` (for `timestamp` columns)
 * - SQLite:  `Date.now()` (for `integer` columns)
 *
 * An optional `offsetMs` adds a duration to the current time
 * (e.g. `dbNow(7 * 24 * 60 * 60 * 1000)` for a 1-week expiry).
 */
export function dbNow(offsetMs?: number): Date | number {
  if (detectDialect() === "pg") {
    return offsetMs ? new Date(Date.now() + offsetMs) : new Date()
  }
  return offsetMs ? Date.now() + offsetMs : Date.now()
}

/**
 * Execute a `select` query and return all matching rows.
 * - SQLite: await q.all()
 * - PG:     await q
 */
export async function queryAll<T>(q: unknown): Promise<T[]> {
  return detectDialect() === "pg" ? await (q as Promise<T[]>) : await (q as { all(): T[] }).all()
}

/**
 * Execute a `select` query and return the first matching row (or undefined).
 * - SQLite: await q.get()
 * - PG:     await q, then extract the first element (PG returns an array)
 */
export async function queryGet<T>(q: unknown): Promise<T | undefined> {
  if (detectDialect() === "pg") {
    const rows = await (q as Promise<T[]>)
    return rows[0]
  }
  return await (q as { get(): T | undefined }).get()
}

/**
 * Execute an `insert`, `update`, or `delete` query.
 * Returns a dialect-agnostic result with `.changes` (SQLite) or `.rowCount` (PG).
 * - SQLite: await q.run()
 * - PG:     await q
 */
export async function queryRun(q: unknown): Promise<{ changes?: number; rowCount?: number }> {
  return detectDialect() === "pg" ? await (q as Promise<{ rowCount: number }>) : await (q as { run(): { changes: number } }).run()
}
