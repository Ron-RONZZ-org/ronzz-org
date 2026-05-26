import { existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import DatabaseImport from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as pgSchema from "./schema/pg/index"
import { detectDialect, resetDialectCache } from "./schema/proxy"
import * as sqliteSchema from "./schema/sqlite/index"

let _db: ReturnType<typeof createDb> | null = null
let _dbClient: InstanceType<typeof DatabaseImport> | Pool | null = null

function createDb() {
  const dialect = detectDialect()

  if (dialect === "pg") {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    _dbClient = pool
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
  const sqlite = new DatabaseImport(isMemory ? ":memory:" : url)
  _dbClient = sqlite
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
  if (_dbClient instanceof Pool) {
    await _dbClient.end()
  } else if (_dbClient instanceof DatabaseImport) {
    _dbClient.close()
  }
  _dbClient = null
  _db = null
}

/** Reset the singleton DB connection and dialect cache. Used in test isolation. */
export function resetDb(): void {
  _db = null
  _dbClient = null
  resetDialectCache()
}
