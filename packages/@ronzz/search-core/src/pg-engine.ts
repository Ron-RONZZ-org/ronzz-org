import * as pgSchema from "database/schema/pg/index"
import { and, eq, like, or, sql } from "drizzle-orm"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type {
  SearchDocument,
  SearchEngine,
  SearchQuery,
  SearchResult,
  SearchResultSet,
} from "./types"

export class PostgresSearchEngine implements SearchEngine {
  constructor(private db: NodePgDatabase<typeof pgSchema>) {}

  async search(query: SearchQuery): Promise<SearchResultSet> {
    const conditions = []

    if (query.query) {
      const searchTerm = `%${query.query}%`
      conditions.push(
        or(
          like(pgSchema.searchIndex.title, searchTerm),
          like(pgSchema.searchIndex.description, searchTerm),
          like(pgSchema.searchIndex.content, searchTerm),
        ),
      )
    }

    if (query.type) {
      conditions.push(eq(pgSchema.searchIndex.type, query.type))
    }

    if (query.locale) {
      conditions.push(eq(pgSchema.searchIndex.locale, query.locale))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await this.db
      .select()
      .from(pgSchema.searchIndex)
      .where(where)
      .limit(query.limit ?? 20)
      .offset(query.offset ?? 0)

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pgSchema.searchIndex)
      .where(where)
    const total = countResult?.count ?? 0

    return {
      results: rows.map((row) => ({
        id: row.id,
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
    const now = new Date()
    await this.db
      .insert(pgSchema.searchIndex)
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
        target: pgSchema.searchIndex.id,
        set: {
          title: doc.title,
          description: doc.description,
          content: doc.content,
          url: doc.url,
          updatedAt: now,
        },
      })
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(pgSchema.searchIndex).where(eq(pgSchema.searchIndex.id, id))
  }

  /** Batch-reindex documents. PG async transactions don't add significant overhead. */
  async reindex(docs: SearchDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.index(doc)
    }
  }
}
