import type { SearchEngine } from "./types"
import { SqliteSearchEngine } from "./sqlite-engine"
import { PostgresSearchEngine } from "./pg-engine"

let _engine: SearchEngine | null = null

export function createSearchEngine(db: unknown): SearchEngine {
  if (_engine) return _engine
  const dialect = detectDialect()
  _engine =
    dialect === "pg"
      ? new PostgresSearchEngine(db as never)
      : new SqliteSearchEngine(db as never)
  return _engine
}

let _dialect: "sqlite" | "pg" | null = null

function detectDialect(): "sqlite" | "pg" {
  if (_dialect) return _dialect
  const url = process.env.DATABASE_URL ?? ""
  _dialect =
    url.startsWith("postgres") || url.startsWith("postgresql") ? "pg" : "sqlite"
  return _dialect
}
