import { SearchEngineImpl } from "./search-engine-impl"
import type { SearchDocument, SearchEngine, SearchQuery, SearchResultSet } from "./types"

/**
 * SQLite search engine.
 * Thin wrapper around the unified SearchEngineImpl.
 */
export class SqliteSearchEngine implements SearchEngine {
  private impl: SearchEngineImpl

  // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB expects any
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
