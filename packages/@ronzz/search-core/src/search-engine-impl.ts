import { escapeLike } from "@ronzz/shared-core"
import { dbNow, queryAll, queryGet, queryRun } from "database/dialect-query"
import { schema } from "database/schema/proxy"
import { and, eq, like, or, sql } from "drizzle-orm"
import type {
  SearchDocument,
  SearchEngine,
  SearchQuery,
  SearchResult,
  SearchResultSet,
} from "./types"

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
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle condition array accepts mixed types
    const conditions: any[] = []

    if (query.query) {
      const searchTerm = `%${escapeLike(query.query)}%`
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: or() returns undefined only for empty arrays
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

    const offset = Math.max(0, query.offset ?? 0)
    const limit = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, 1000)

    const q = this.db.select().from(schema.searchIndex).where(where).limit(limit).offset(offset)

    const rows = await queryAll<Record<string, unknown>>(q)

    const countQ = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.searchIndex)
      .where(where)

    const countResult = await queryGet<{ count: number }>(countQ)

    return {
      results: rows.map((row) => ({
        id: row.id as string,
        type: row.type as SearchResult["type"],
        locale: row.locale as SearchResult["locale"],
        title: row.title as string,
        description: row.description as string,
        url: row.url as string,
        score: row.score as number,
      })),
      total: countResult?.count ?? 0,
    }
  }

  async index(doc: SearchDocument): Promise<void> {
    const now = dbNow()
    await queryRun(
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
    )
  }

  async remove(id: string): Promise<void> {
    await queryRun(this.db.delete(schema.searchIndex).where(eq(schema.searchIndex.id, id)))
  }

  /** Batch-reindex documents. */
  async reindex(docs: SearchDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.index(doc)
    }
  }
}

const DEFAULT_PAGE_SIZE = 20
