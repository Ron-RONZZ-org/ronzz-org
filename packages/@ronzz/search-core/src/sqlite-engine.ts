import { eq, and, like, or } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { SearchEngine, SearchDocument, SearchQuery, SearchResult } from "./types"

export class SqliteSearchEngine implements SearchEngine {
  // biome-ignore lint/suspicious/noExplicitAny: <dialect-agnostic db>
  constructor(private db: any) {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
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
    await this.db
      .delete(schema.searchIndex)
      .where(eq(schema.searchIndex.id, id))
      .run()
  }

  async reindex(docs: SearchDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.index(doc)
    }
  }
}
