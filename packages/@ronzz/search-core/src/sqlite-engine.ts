import { schema } from "database/schema/proxy"
import { and, eq, like, or, sql } from "drizzle-orm"
import type {
  SearchDocument,
  SearchEngine,
  SearchQuery,
  SearchResult,
  SearchResultSet,
} from "./types"

export class SqliteSearchEngine implements SearchEngine {
  // biome-ignore lint/suspicious/noExplicitAny: <dialect-agnostic db>
  constructor(private db: any) {}

  async search(query: SearchQuery): Promise<SearchResultSet> {
    const conditions: any[] = []

    if (query.query) {
      const searchTerm = `%${query.query}%`
      conditions.push(
        or(
          like(schema.searchIndex.title, searchTerm),
          like(schema.searchIndex.description, searchTerm),
          like(schema.searchIndex.content, searchTerm),
        )!,
      )
    }

    if (query.type) {
      conditions.push(eq(schema.searchIndex.type, query.type))
    }

    if (query.locale) {
      conditions.push(eq(schema.searchIndex.locale, query.locale))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await this.db
      .select()
      .from(schema.searchIndex)
      .where(where)
      .limit(query.limit ?? 20)
      .offset(query.offset ?? 0)
      .all()

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.searchIndex)
      .where(where)
      .get()
    const total = countResult?.count ?? 0

    return {
      results: rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        type: row.type as SearchResult["type"],
        locale: row.locale as SearchResult["locale"],
        title: row.title,
        description: row.description,
        url: row.url,
        score: row.score,
      })),
      total,
    }
  }

  async index(doc: SearchDocument): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .insert(schema.searchIndex)
      .values({
        id: doc.id,
        type: doc.type,
        locale: doc.locale,
        title: doc.title,
        description: doc.description,
        content: doc.content,
        url: doc.url,
        score: 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.searchIndex.id,
        set: {
          title: doc.title,
          description: doc.description,
          content: doc.content,
          url: doc.url,
          updatedAt: now,
        },
      })
      .run()
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(schema.searchIndex).where(eq(schema.searchIndex.id, id)).run()
  }

  /** Batch-reindex documents in a transaction for performance. */
  async reindex(docs: SearchDocument[]): Promise<void> {
    if (docs.length === 0) return
    const now = new Date().toISOString()
    // Use synchronous transaction (better-sqlite3 doesn't support async)
    // biome-ignore lint/suspicious/noExplicitAny: dialect-agnostic tx
    this.db.transaction((tx: any) => {
      for (const doc of docs) {
        tx.insert(schema.searchIndex)
          .values({
            id: doc.id,
            type: doc.type,
            locale: doc.locale,
            title: doc.title,
            description: doc.description,
            content: doc.content,
            url: doc.url,
            score: 0,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.searchIndex.id,
            set: {
              title: doc.title,
              description: doc.description,
              content: doc.content,
              url: doc.url,
              updatedAt: now,
            },
          })
          .run()
      }
    })
  }
}
