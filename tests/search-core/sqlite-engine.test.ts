import { describe, it, expect, beforeEach } from "vitest"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as sqliteSchema from "database/schema/sqlite/index"
import { SqliteSearchEngine } from "@ronzz/search-core"
import type { SearchDocument, SearchQuery } from "@ronzz/search-core"

function createTestDb() {
  const sqlite = new Database(":memory:")
  sqlite.exec(`
    CREATE TABLE "search_index" (
      "id" text PRIMARY KEY NOT NULL,
      "type" text NOT NULL,
      "locale" text NOT NULL,
      "title" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "content" text NOT NULL DEFAULT '',
      "url" text NOT NULL,
      "score" real NOT NULL DEFAULT 0,
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL
    );
  `)
  return drizzle(sqlite, { schema: sqliteSchema })
}

const sampleDoc: SearchDocument = {
  id: "doc-1",
  type: "resource",
  locale: "fr",
  title: "Test Document",
  description: "A test search document",
  content: "This is the full content of the test document for search testing.",
  url: "https://example.com/doc-1",
}

describe("SqliteSearchEngine", () => {
  let engine: SqliteSearchEngine

  beforeEach(() => {
    const db = createTestDb()
    engine = new SqliteSearchEngine(db as any)
  })

  describe("index", () => {
    it("indexes a document", async () => {
      await engine.index(sampleDoc)

      const { results, total } = await engine.search({ query: "Test" })
      expect(results).toHaveLength(1)
      expect(total).toBe(1)
      expect(results[0].title).toBe("Test Document")
    })

    it("updates existing document on re-index", async () => {
      await engine.index(sampleDoc)
      await engine.index({ ...sampleDoc, title: "Updated Document" })

      const { results } = await engine.search({ query: "Updated" })
      expect(results).toHaveLength(1)
    })
  })

  describe("search", () => {
    beforeEach(async () => {
      await engine.index(sampleDoc)
      await engine.index({
        id: "doc-2",
        type: "dataset",
        locale: "en",
        title: "English Dataset",
        description: "An English dataset",
        content: "Dataset content in English",
        url: "https://example.com/dataset-2",
      })
      await engine.index({
        id: "doc-3",
        type: "article",
        locale: "eo",
        title: "Esperanta Artikolo",
        description: "Artikolo en Esperanto",
        content: "Esperanta enhavo por serĉado",
        url: "https://example.com/article-3",
      })
    })

    it("returns empty results for no match", async () => {
      const { results, total } = await engine.search({ query: "zzzznonexistent" })
      expect(results).toEqual([])
      expect(total).toBe(0)
    })

    it("searches by query across title, description, and content", async () => {
      const { results, total } = await engine.search({ query: "English" })
      expect(results).toHaveLength(1)
      expect(total).toBe(1)
      expect(results[0].id).toBe("doc-2")
    })

    it("filters by type", async () => {
      const { results, total } = await engine.search({ query: "", type: "dataset" })
      expect(results).toHaveLength(1)
      expect(total).toBe(1)
      expect(results[0].type).toBe("dataset")
    })

    it("filters by locale", async () => {
      const { results, total } = await engine.search({ query: "", locale: "eo" })
      expect(results).toHaveLength(1)
      expect(total).toBe(1)
      expect(results[0].locale).toBe("eo")
    })

    it("respects limit and offset", async () => {
      // Insert 5 more docs for offset testing
      for (let i = 0; i < 5; i++) {
        await engine.index({
          id: `extra-${i}`,
          type: "resource" as const,
          locale: "fr" as const,
          title: `Extra Document ${i}`,
          description: `Extra ${i}`,
          content: `Content ${i}`,
          url: `https://example.com/extra-${i}`,
        })
      }

      const { results, total } = await engine.search({ query: "", limit: 2, offset: 1 })
      expect(results).toHaveLength(2)
      expect(total).toBe(8) // 3 original + 5 extra
    })
  })

  describe("remove", () => {
    it("removes a document from the index", async () => {
      await engine.index(sampleDoc)
      await engine.remove("doc-1")

      const { results } = await engine.search({ query: "Test" })
      expect(results).toHaveLength(0)
    })

    it("does not error when removing non-existent document", async () => {
      await expect(engine.remove("non-existent")).resolves.toBeUndefined()
    })
  })

  describe("reindex", () => {
    it("indexes multiple documents", async () => {
      await engine.reindex([
        sampleDoc,
        {
          id: "doc-4",
          type: "dataset",
          locale: "en",
          title: "Bulk Dataset",
          description: "Bulk description",
          content: "Bulk content",
          url: "https://example.com/bulk",
        },
      ])

      const { results } = await engine.search({ query: "Bulk" })
      expect(results).toHaveLength(1)
    })
  })
})
