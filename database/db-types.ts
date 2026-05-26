import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type * as pgSchema from "./schema/pg/index"
import type * as sqliteSchema from "./schema/sqlite/index"

/**
 * Unified database type that accepts either SQLite (dev) or PostgreSQL (prod) instances.
 * Internally cast to `any` in query functions since the schema proxy handles runtime selection.
 */
export type Database = BetterSQLite3Database<typeof sqliteSchema> | NodePgDatabase<typeof pgSchema>
