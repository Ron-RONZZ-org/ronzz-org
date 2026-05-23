import type { SearchEngine } from "./types"
import { SqliteSearchEngine } from "./sqlite-engine"
import { PostgresSearchEngine } from "./pg-engine"

export function createSearchEngine(db: unknown): SearchEngine {
  const dialect = detectDialect()
  if (dialect === "pg") {
    return new PostgresSearchEngine(db as never)
  }
  return new SqliteSearchEngine(db as never)
}

function detectDialect(): "sqlite" | "pg" {
  const url = process.env.DATABASE_URL ?? ""
  if (url.startsWith("postgres") || url.startsWith("postgresql")) {
    return "pg"
  }
  return "sqlite"
}
