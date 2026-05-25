import { describe, it, expect, beforeEach, vi } from "vitest"
import { PostgresSearchEngine } from "@ronzz/search-core"
import type { SearchDocument, SearchQuery } from "@ronzz/search-core"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"

// Mock drizzle-orm operators to avoid import issues in test context
vi.mock("drizzle-orm", () => ({
  eq: (a: unknown, b: unknown) => ({ op: "eq", a, b }),
  and: (...args: unknown[]) => ({ op: "and", args }),
  or: (...args: unknown[]) => ({ op: "or", args }),
  like: (a: unknown, b: unknown) => ({ op: "like", a, b }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    op: "sql",
    strings,
    values,
  }),
}))

vi.mock("database/schema/pg/index", () => ({
  searchIndex: {
    id: "searchIndex.id",
    type: "searchIndex.type",
    locale: "searchIndex.locale",
    title: "searchIndex.title",
    description: "searchIndex.description",
    content: "searchIndex.content",
    url: "searchIndex.url",
    score: "searchIndex.score",
    createdAt: "searchIndex.createdAt",
    updatedAt: "searchIndex.updatedAt",
  },
}))

const sampleDoc: SearchDocument = {
  id: "doc-1",
  type: "resource",
  locale: "fr",
  title: "Test Document",
  description: "A test search document",
  content: "This is the full content of the test document for search testing.",
  url: "https://example.com/doc-1",
}

describe("PostgresSearchEngine", () => {
  let engine: PostgresSearchEngine
  let mockDb: Partial<NodePgDatabase<Record<string, unknown>>>

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
      }) as unknown as NodePgDatabase<Record<string, unknown>>["select"],
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
      }) as unknown as NodePgDatabase<Record<string, unknown>>["insert"],
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
      }) as unknown as NodePgDatabase<Record<string, unknown>>["delete"],
    }

    engine = new PostgresSearchEngine(mockDb as NodePgDatabase<any>)
  })

  describe("search", () => {
    it("returns results matching query text", async () => {
      const mockRows = [
        {
          id: "doc-1",
          type: "resource",
          locale: "fr",
          title: "Test Document",
          description: "A test search document",
          url: "https://example.com/doc-1",
          score: 0,
        },
      ]
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRows),
      })
      const mockCountSelect = vi.fn().mockResolvedValue([{ count: 1 }])
      mockDb.select = mockSelect as any
      // Override the second .select() call to return count
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue(mockRows),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        })

      const result = await engine.search({ query: "Test" })

      expect(result.results).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.results[0].title).toBe("Test Document")
    })

    it("returns empty results for no match", async () => {
      const mockSelect = vi.fn()
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        })
      mockDb.select = mockSelect as any

      const result = await engine.search({ query: "nonexistent" })
      expect(result.results).toEqual([])
      expect(result.total).toBe(0)
    })

    it("filters by type", async () => {
      const mockSelect = vi.fn()
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        })
      mockDb.select = mockSelect as any

      await engine.search({ query: "", type: "dataset" })

      // Verify that select was called (search behavior didn't throw)
      expect(mockSelect).toHaveBeenCalled()
    })

    it("respects limit and offset", async () => {
      let capturedLimit: number | undefined
      let capturedOffset: number | undefined

      const queryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation((l: number) => {
          capturedLimit = l
          return queryBuilder
        }),
        offset: vi.fn().mockImplementation((o: number) => {
          capturedOffset = o
          return Promise.resolve([])
        }),
      }

      const countQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }

      const mockSelect = vi
        .fn()
        .mockReturnValueOnce(queryBuilder)
        .mockReturnValueOnce(countQuery)
      mockDb.select = mockSelect as any

      await engine.search({ query: "", limit: 5, offset: 10 })
      expect(capturedLimit).toBe(5)
      expect(capturedOffset).toBe(10)
    })
  })

  describe("index", () => {
    it("inserts a document", async () => {
      const mockValues = vi.fn().mockReturnThis()
      const mockOnConflict = vi.fn().mockResolvedValue(undefined)
      mockDb.insert = vi.fn().mockReturnValue({
        values: mockValues,
        onConflictDoUpdate: mockOnConflict,
      }) as any

      await engine.index(sampleDoc)

      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockOnConflict).toHaveBeenCalled()
    })
  })

  describe("remove", () => {
    it("removes a document by id", async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      mockDb.delete = vi.fn().mockReturnValue({
        where: mockWhere,
      }) as any

      await engine.remove("doc-1")

      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
    })

    it("does not error when removing non-existent document", async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      mockDb.delete = vi.fn().mockReturnValue({
        where: mockWhere,
      }) as any

      await expect(engine.remove("non-existent")).resolves.toBeUndefined()
    })
  })

  describe("reindex", () => {
    it("indexes multiple documents", async () => {
      const indexSpy = vi.spyOn(PostgresSearchEngine.prototype, "index")
      indexSpy.mockResolvedValue(undefined)

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

      expect(indexSpy).toHaveBeenCalledTimes(2)
      indexSpy.mockRestore()
    })
  })
})
