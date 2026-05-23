import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq, and, like, or, sql } from "drizzle-orm"
import * as sqliteSchema from "database/schema/sqlite/index"
import type { SearchEngine, SearchDocument, SearchQuery, SearchResult } from "./types"

export class SqliteSearchEngine implements SearchEngine {
  constructor(private db: BetterSQLite3Database<typeof sqliteSchema>) {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const conditions = []

    if (query.query) {
      const searchTerm = `%${query.query}%`
      conditions.push(
        or(
          like(sqliteSchema.searchIndex.title, searchTerm),
          like(sqliteSchema.searchIndex.description, searchTerm),
          like(sqliteSchema.searchIndex.content, searchTerm),
        ),
      )
    }

    if (query.type) {
      conditions.push(eq(sqliteSchema.searchIndex.type, query.type))
    }

    if (query.locale) {
      conditions.push(eq(sqliteSchema.searchIndex.locale, query.locale))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await this.db
      .select()
      .from(sqliteSchema.searchIndex)
      .where(where)
      .limit(query.limit ?? 20)
      .offset(query.offset ?? 0)
      .all()

    return rows.map((row) => ({
      id: row.id,
      type: row.type as SearchResult["type"],
      locale: row.locale as SearchResult["locale"],
      title: row.title,
      description: row.description,
      url: row.url,
      score: row.score,
    }))
  }

  async index(doc: SearchDocument): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .insert(sqliteSchema.searchIndex)
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
        target: sqliteSchema.searchIndex.id,
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
    await this.db
      .delete(sqliteSchema.searchIndex)
      .where(eq(sqliteSchema.searchIndex.id, id))
      .run()
  }

  async reindex(docs: SearchDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.index(doc)
    }
  }
}
