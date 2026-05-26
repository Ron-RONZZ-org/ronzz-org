import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"
import { mockEvent } from "../helpers/mock-event"

describe("Datasets API", () => {
  beforeEach(() => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    const db = getDb() as Database
    createTestTables(db)
  })

  describe("GET /stats/api/v1/datasets", () => {
    it("returns empty list when no datasets exist", async () => {
      const { GET } = await import("$lib/../routes/stats/api/v1/datasets/+server.ts")
      const response = await GET(mockEvent())
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.datasets).toEqual([])
      expect(body.total).toBe(0)
    })

    it("lists datasets with pagination", async () => {
      // Create datasets via the core function directly
      const { createDataset } = await import("@ronzz/ronstats-core")
      const db = getDb() as Database
      for (let i = 0; i < 3; i++) {
        await createDataset(db, {
          title: `Dataset ${i}`,
          description: `Description ${i}`,
        })
      }

      const { GET } = await import("$lib/../routes/stats/api/v1/datasets/+server.ts")
      const response = await GET(mockEvent({ url: "http://localhost:5173/?limit=2" }))
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.datasets).toHaveLength(2)
      expect(body.total).toBe(3)
      expect(body.limit).toBe(2)
    })
  })

  describe("POST /stats/api/v1/datasets", () => {
    it("creates a dataset when admin", async () => {
      const { POST } = await import("$lib/../routes/stats/api/v1/datasets/+server.ts")
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const response = await POST(
        mockEvent({
          method: "POST",
          body: {
            title: "New Dataset",
            description: "A test dataset",
            locale: "fr",
            chartType: "bar",
          },
          user: adminUser,
        }),
      )
      expect(response.status).toBe(201)

      const body = await response.json()
      expect(body.dataset).toBeTruthy()
      expect(body.dataset.title).toBe("New Dataset")
      expect(body.dataset.id).toBeTruthy()
    })

    it("rejects creation when not admin", async () => {
      const { POST } = await import("$lib/../routes/stats/api/v1/datasets/+server.ts")
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const response = await POST(
        mockEvent({
          method: "POST",
          body: { title: "New Dataset" },
          user: editorUser,
        }),
      )
      expect(response.status).toBe(403)

      const body = await response.json()
      expect(body.error).toBe("Forbidden")
    })

    it("rejects creation when unauthenticated", async () => {
      const { POST } = await import("$lib/../routes/stats/api/v1/datasets/+server.ts")

      const response = await POST(
        mockEvent({
          method: "POST",
          body: { title: "New Dataset" },
          user: null,
        }),
      )
      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.error).toBe("Unauthorized")
    })

    it("rejects invalid dataset data", async () => {
      const { POST } = await import("$lib/../routes/stats/api/v1/datasets/+server.ts")
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const response = await POST(
        mockEvent({
          method: "POST",
          body: { title: "" }, // Empty title should fail validation
          user: adminUser,
        }),
      )
      expect(response.status).toBe(400)
    })
  })
})
