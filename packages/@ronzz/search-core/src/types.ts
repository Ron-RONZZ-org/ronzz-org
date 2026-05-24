import type { Locale } from "@ronzz/shared-core"

export type SearchResultType = "resource" | "dataset" | "article"

export interface SearchDocument {
  id: string
  type: SearchResultType
  locale: Locale
  title: string
  description: string
  content: string
  url: string
}

export interface SearchQuery {
  query: string
  type?: SearchResultType
  locale?: Locale
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: string
  type: SearchResultType
  locale: Locale
  title: string
  description: string
  url: string
  score: number
}

export interface SearchResultSet {
  results: SearchResult[]
  total: number
}

export interface SearchEngine {
  search(query: SearchQuery): Promise<SearchResultSet>
  index(doc: SearchDocument): Promise<void>
  remove(id: string): Promise<void>
  reindex(docs: SearchDocument[]): Promise<void>
}
