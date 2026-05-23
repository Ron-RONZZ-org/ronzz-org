import { mkdirSync, existsSync } from "node:fs"
import { dirname } from "node:path"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres"
import Database from "better-sqlite3"
import { Pool } from "pg"
import * as sqliteSchema from "./schema/sqlite/index"
import * as pgSchema from "./schema/pg/index"

type DbDialect = "sqlite" | "pg"

function detectDialect(): DbDialect {
  const url = process.env.DATABASE_URL ?? ""
  if (url.startsWith("postgres") || url.startsWith("postgresql")) {
    return "pg"
  }
  return "sqlite"
}

let _db: ReturnType<typeof createDb> | null = null

function createDb() {
  const dialect = detectDialect()

  if (dialect === "pg") {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    return drizzlePg(pool, { schema: pgSchema })
  }

  const url = process.env.DATABASE_URL ?? "./ronzz.db"
  const isMemory = url === ":memory:"
  if (!isMemory) {
    const dir = dirname(url)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
  const sqlite = new Database(isMemory ? ":memory:" : url)
  if (!isMemory) {
    sqlite.pragma("journal_mode = WAL")
  }
  return drizzle(sqlite, { schema: sqliteSchema })
}

export function getDb() {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

/** Call during shutdown to close DB connections. */
export async function closeDb(): Promise<void> {
  if (!_db) return
  // For SQLite, the better-sqlite3 connection is closed via the returned db
  _db = null
}
