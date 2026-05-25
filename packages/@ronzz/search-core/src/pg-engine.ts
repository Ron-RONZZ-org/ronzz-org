import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type * as pgSchema from "database/schema/pg/index"
import type { SearchEngine, SearchQuery, SearchDocument, SearchResultSet } from "./types"
import { SearchEngineImpl } from "./search-engine-impl"

/**
 * PostgreSQL search engine.
 * Thin wrapper around the unified SearchEngineImpl.
 */
export class PostgresSearchEngine implements SearchEngine {
  private impl: SearchEngineImpl

  constructor(db: NodePgDatabase<typeof pgSchema>) {
    this.impl = new SearchEngineImpl(db, "pg")
  }

  search(query: SearchQuery): Promise<SearchResultSet> {
    return this.impl.search(query)
  }

  index(doc: SearchDocument): Promise<void> {
    return this.impl.index(doc)
  }

  remove(id: string): Promise<void> {
    return this.impl.remove(id)
  }

  reindex(docs: SearchDocument[]): Promise<void> {
    return this.impl.reindex(docs)
  }
}
