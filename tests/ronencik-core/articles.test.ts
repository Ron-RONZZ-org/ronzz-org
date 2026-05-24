import { describe, it, expect, beforeEach } from "vitest"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as sqliteSchema from "database/schema/sqlite/index"
import {
  listArticles,
  getArticleBySlug,
  upsertArticleMetadata,
  deleteArticle,
} from "@ronzz/ronencik-core"
import type { ArticleMetadataInput } from "@ronzz/ronencik-core"

function createTestDb() {
  const sqlite = new Database(":memory:")
  sqlite.exec(`
    CREATE TABLE "article_metadata" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "locale" text NOT NULL DEFAULT 'fr',
      "metadata" text DEFAULT '{}',
      "published_at" text,
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL,
      "deleted_at" text
    );
  `)
  return drizzle(sqlite, { schema: sqliteSchema })
}

const sampleInput: ArticleMetadataInput = {
  slug: "test-article",
  title: "Test Article",
  description: "A test article description",
  locale: "fr",
  metadata: { tags: ["test"] },
  publishedAt: "2025-01-01T00:00:00Z",
}

describe("articles queries", () => {
  let db: ReturnType<typeof createTestDb>

  beforeEach(() => {
    db = createTestDb()
  })

  describe("upsertArticleMetadata", () => {
    it("creates a new article metadata entry", async () => {
      const result = await upsertArticleMetadata(db as any, sampleInput)

      expect(result.id).toBeTruthy()
      expect(result.slug).toBe("test-article")
      expect(result.title).toBe("Test Article")
      expect(result.description).toBe("A test article description")
      expect(result.locale).toBe("fr")
      expect(result.metadata).toEqual({ tags: ["test"] })
      expect(result.publishedAt).toBe("2025-01-01T00:00:00Z")
      expect(result.createdAt).toBeTruthy()
      expect(result.updatedAt).toBeTruthy()
    })

    it("updates existing article by slug", async () => {
      const created = await upsertArticleMetadata(db as any, sampleInput)

      const updated = await upsertArticleMetadata(db as any, {
        slug: "test-article",
        title: "Updated Article",
        description: "Updated description",
      })

      expect(updated.id).toBe(created.id)
      expect(updated.title).toBe("Updated Article")
      expect(updated.description).toBe("Updated description")
      // Preserved from original
      expect(updated.locale).toBe("fr")
      expect(updated.metadata).toEqual({ tags: ["test"] })
    })

    it("uses defaults for optional fields on create", async () => {
      const result = await upsertArticleMetadata(db as any, {
        slug: "minimal",
        title: "Minimal",
      })

      expect(result.description).toBe("")
      expect(result.locale).toBe("fr")
      expect(result.metadata).toEqual({})
      expect(result.publishedAt).toBeNull()
    })
  })

  describe("listArticles", () => {
    it("returns empty list when no articles exist", async () => {
      const { articles, total } = await listArticles(db as any)
      expect(articles).toEqual([])
      expect(total).toBe(0)
    })

    it("lists all articles", async () => {
      await upsertArticleMetadata(db as any, sampleInput)
      await upsertArticleMetadata(db as any, { slug: "second", title: "Second" })

      const { articles, total } = await listArticles(db as any)
      expect(total).toBe(2)
      expect(articles).toHaveLength(2)
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await upsertArticleMetadata(db as any, { slug: `article-${i}`, title: `Article ${i}` })
      }

      const { articles, total } = await listArticles(db as any, { limit: 2, offset: 1 })
      expect(total).toBe(5)
      expect(articles).toHaveLength(2)
      // No ORDER BY in listArticles — insertion order expected
      expect(articles[0].title).toBe("Article 1")
      expect(articles[1].title).toBe("Article 2")
    })

    it("filters by locale", async () => {
      await upsertArticleMetadata(db as any, { slug: "fr-article", title: "FR", locale: "fr" })
      await upsertArticleMetadata(db as any, { slug: "en-article", title: "EN", locale: "en" })
      await upsertArticleMetadata(db as any, { slug: "eo-article", title: "EO", locale: "eo" })

      const { articles, total } = await listArticles(db as any, { locale: "fr" })
      expect(total).toBe(1)
      expect(articles[0].locale).toBe("fr")
    })
  })

  describe("getArticleBySlug", () => {
    it("returns undefined for non-existent slug", async () => {
      const result = await getArticleBySlug(db as any, "non-existent")
      expect(result).toBeUndefined()
    })

    it("returns article by slug", async () => {
      await upsertArticleMetadata(db as any, sampleInput)
      const result = await getArticleBySlug(db as any, "test-article")
      expect(result).toBeTruthy()
      expect(result!.title).toBe("Test Article")
    })
  })

  describe("deleteArticle", () => {
    it("deletes an article by id", async () => {
      const created = await upsertArticleMetadata(db as any, sampleInput)
      const deleted = await deleteArticle(db as any, created.id)

      expect(deleted).toBe(true)
      const { articles, total } = await listArticles(db as any)
      expect(total).toBe(0)
    })

    it("returns false for non-existent article", async () => {
      const result = await deleteArticle(db as any, "non-existent")
      expect(result).toBe(false)
    })
  })
})
