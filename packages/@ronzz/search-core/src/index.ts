export { createSearchEngine } from "./engine"
export { SqliteSearchEngine } from "./sqlite-engine"
export { PostgresSearchEngine } from "./pg-engine"
export type {
  SearchEngine,
  SearchDocument,
  SearchQuery,
  SearchResult,
  SearchResultSet,
  SearchResultType,
} from "./types"
