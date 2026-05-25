import { detectDialect } from "database/schema/proxy"
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

/** Reset the engine singleton. Used for test isolation. */
export function resetSearchEngine(): void {
  _engine = null
}
