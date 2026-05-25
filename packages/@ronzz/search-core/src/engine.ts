import { detectDialect } from "database/schema/proxy"
import type { SearchEngine } from "./types"
import { SqliteSearchEngine } from "./sqlite-engine"
import { PostgresSearchEngine } from "./pg-engine"

let _engine: SearchEngine | null = null
let _engineDialect: string | null = null

export function createSearchEngine(db: unknown): SearchEngine {
  const currentDialect = detectDialect()

  // Re-create engine if dialect changed (e.g., DB was reset/reconnected)
  if (_engine && _engineDialect === currentDialect) {
    return _engine
  }

  const engine =
    currentDialect === "pg"
      ? new PostgresSearchEngine(db as never)
      : new SqliteSearchEngine(db as never)

  _engine = engine
  _engineDialect = currentDialect
  return engine
}

/** Reset the engine singleton. Used for test isolation. */
export function resetSearchEngine(): void {
  _engine = null
  _engineDialect = null
}
