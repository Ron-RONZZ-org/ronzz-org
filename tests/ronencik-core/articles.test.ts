import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, getDb } from "database/db"
import type { Database } from "database/db-types"
import {
  listArticles,
  getArticleBySlug,
  upsertArticleMetadata,
  deleteArticle,
} from "@ronzz/ronencik-core"
import type { ArticleMetadataInput } from "@ronzz/ronencik-core"
import { createTestTables } from "../helpers/create-test-tables"

const sampleInput: ArticleMetadataInput = {
  slug: "test-article",
  title: "Test Article",
  description: "A test article description",
  locale: "fr",
  metadata: { tags: ["test"] },
  publishedAt: "2025-01-01T00:00:00Z",
}

describe("articles queries", () => {
  let db: Database

  beforeEach(() => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    db = getDb() as Database
    createTestTables(db)
  })

  describe("upsertArticleMetadata", () => {
    it("creates a new article metadata entry", async () => {
      const result = await upsertArticleMetadata( db, sampleInput)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.id).toBeTruthy()
      expect(result.value.slug).toBe("test-article")
      expect(result.value.title).toBe("Test Article")
      expect(result.value.description).toBe("A test article description")
      expect(result.value.locale).toBe("fr")
      expect(result.value.metadata).toEqual({ tags: ["test"] })
      expect(result.value.publishedAt).toBe("2025-01-01T00:00:00Z")
      expect(result.value.createdAt).toBeTruthy()
      expect(result.value.updatedAt).toBeTruthy()
    })

    it("updates existing article by slug", async () => {
      const createdResult = await upsertArticleMetadata( db, sampleInput)
      expect(createdResult.ok).toBe(true)
      if (!createdResult.ok) return
      const created = createdResult.value

      const updatedResult = await upsertArticleMetadata( db, {
        slug: "test-article",
        title: "Updated Article",
        description: "Updated description",
      })
      expect(updatedResult.ok).toBe(true)
      if (!updatedResult.ok) return
      const updated = updatedResult.value

      expect(updated.id).toBe(created.id)
      expect(updated.title).toBe("Updated Article")
      expect(updated.description).toBe("Updated description")
      // Preserved from original
      expect(updated.locale).toBe("fr")
      expect(updated.metadata).toEqual({ tags: ["test"] })
    })

    it("uses defaults for optional fields on create", async () => {
      const result = await upsertArticleMetadata( db, {
        slug: "minimal",
        title: "Minimal",
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.description).toBe("")
      expect(result.value.locale).toBe("fr")
      expect(result.value.metadata).toEqual({})
      expect(result.value.publishedAt).toBeNull()
    })
  })

  describe("listArticles", () => {
    it("returns empty list when no articles exist", async () => {
      const { articles, total } = await listArticles( db)
      expect(articles).toEqual([])
      expect(total).toBe(0)
    })

    it("lists all articles", async () => {
      await upsertArticleMetadata( db, sampleInput)
      await upsertArticleMetadata( db, { slug: "second", title: "Second" })

      const { articles, total } = await listArticles( db)
      expect(total).toBe(2)
      expect(articles).toHaveLength(2)
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await upsertArticleMetadata( db, { slug: `article-${i}`, title: `Article ${i}` })
      }

      const { articles, total } = await listArticles( db, { limit: 2, offset: 1 })
      expect(total).toBe(5)
      expect(articles).toHaveLength(2)
      // ORDER BY createdAt DESC — newest first, offset 1 skips Article 4
      expect(articles[0].title).toBe("Article 3")
      expect(articles[1].title).toBe("Article 2")
    })

    it("filters by locale", async () => {
      await upsertArticleMetadata( db, { slug: "fr-article", title: "FR", locale: "fr" })
      await upsertArticleMetadata( db, { slug: "en-article", title: "EN", locale: "en" })
      await upsertArticleMetadata( db, { slug: "eo-article", title: "EO", locale: "eo" })

      const { articles, total } = await listArticles( db, { locale: "fr" })
      expect(total).toBe(1)
      expect(articles[0].locale).toBe("fr")
    })
  })

  describe("getArticleBySlug", () => {
    it("returns undefined for non-existent slug", async () => {
      const result = await getArticleBySlug( db, "non-existent")
      expect(result).toBeUndefined()
    })

    it("returns article by slug", async () => {
      await upsertArticleMetadata( db, sampleInput)
      const result = await getArticleBySlug( db, "test-article")
      expect(result).toBeTruthy()
      expect(result!.title).toBe("Test Article")
    })
  })

  describe("deleteArticle", () => {
    it("deletes an article by id", async () => {
      const createdResult = await upsertArticleMetadata( db, sampleInput)
      expect(createdResult.ok).toBe(true)
      if (!createdResult.ok) return

      const deleted = await deleteArticle( db, createdResult.value.id)
      expect(deleted.ok).toBe(true)
      if (!deleted.ok) return
      expect(deleted.value).toBe(true)

      const { articles, total } = await listArticles( db)
      expect(total).toBe(0)
    })

    it("returns false for non-existent article", async () => {
      const result = await deleteArticle( db, "non-existent")
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value).toBe(false)
    })
  })
})
