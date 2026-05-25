import { eq, and, like, or, sql } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { SearchEngine, SearchDocument, SearchQuery, SearchResult, SearchResultSet } from "./types"

/**
 * Helper to add `.run()` only for SQLite (PG awaits directly).
 * SQLite returns { changes }, PG returns { rowCount } — both checked via ??.
 */
// biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
async function dbRun(promiseOrChain: any, dialect: "sqlite" | "pg"): Promise<any> {
  if (dialect === "pg") return promiseOrChain
  return promiseOrChain.run()
}

/**
 * Unified search engine implementation that works with both SQLite and PostgreSQL.
 * Uses the schema proxy for dialect-agnostic table references.
 */
export class SearchEngineImpl implements SearchEngine {
  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    private db: any,
    private dialect: "sqlite" | "pg",
  ) {}

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

    let q = this.db
      .select()
      .from(schema.searchIndex)
      .where(where)
      .limit(query.limit ?? DEFAULT_PAGE_SIZE)
      .offset(query.offset ?? 0)

    const rows = this.dialect === "pg" ? await q : await q.all()

    const countQ = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.searchIndex)
      .where(where)

    const countResult = this.dialect === "pg"
      ? (await countQ)[0]
      : await countQ.get()

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
      total: countResult?.count ?? 0,
    }
  }

  async index(doc: SearchDocument): Promise<void> {
    const now = this.dialect === "pg" ? new Date() : new Date().toISOString()
    await dbRun(
      this.db
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
        }),
      this.dialect,
    )
  }

  async remove(id: string): Promise<void> {
    await dbRun(
      this.db
        .delete(schema.searchIndex)
        .where(eq(schema.searchIndex.id, id)),
      this.dialect,
    )
  }

  /** Batch-reindex documents. */
  async reindex(docs: SearchDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.index(doc)
    }
  }
}

const DEFAULT_PAGE_SIZE = 20
