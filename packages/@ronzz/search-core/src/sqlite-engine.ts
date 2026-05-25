import type { SearchEngine, SearchQuery, SearchDocument, SearchResultSet } from "./types"
import { SearchEngineImpl } from "./search-engine-impl"

/**
 * SQLite search engine.
 * Thin wrapper around the unified SearchEngineImpl.
 */
// biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
export class SqliteSearchEngine implements SearchEngine {
  private impl: SearchEngineImpl

  constructor(db: any) {
    this.impl = new SearchEngineImpl(db, "sqlite")
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
