import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"
import { mockEvent } from "../helpers/mock-event"

describe("Datapoints API", () => {
  let datasetId: string

  beforeEach(async () => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    const db = getDb() as Database
    createTestTables(db)

    // Create a dataset to reference
    const { createDataset } = await import("@ronzz/ronstats-core")
    const result = await createDataset(db, { title: "Test Dataset" })
    if (result.ok) {
      datasetId = result.value.id
    }
  })

  describe("GET /stats/api/v1/datasets/[uuid]/datapoints", () => {
    it("returns empty list when no datapoints exist", async () => {
      const { GET } = await import(
        "$lib/../routes/stats/api/v1/datasets/[uuid]/datapoints/+server.ts"
      )
      const response = await GET(mockEvent({ params: { uuid: datasetId } }))
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.datapoints).toEqual([])
      expect(body.pagination.total).toBe(0)
    })

    it("returns datapoints when they exist", async () => {
      // Create a datapoint
      const { createDatapoint } = await import("@ronzz/ronstats-core")
      const db = getDb() as Database
      await createDatapoint(db as never, {
        datasetId,
        dimensionKey: "year",
        dimensionValue: "2024",
        value: 42.5,
      })

      const { GET } = await import(
        "$lib/../routes/stats/api/v1/datasets/[uuid]/datapoints/+server.ts"
      )
      const response = await GET(mockEvent({ params: { uuid: datasetId } }))
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.datapoints).toHaveLength(1)
      expect(body.datapoints[0].value).toBe(42.5)
      expect(body.pagination.total).toBe(1)
    })
  })

  describe("POST /stats/api/v1/datasets/[uuid]/datapoints", () => {
    it("creates a single datapoint when authenticated", async () => {
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const { POST } = await import(
        "$lib/../routes/stats/api/v1/datasets/[uuid]/datapoints/+server.ts"
      )
      const response = await POST(
        mockEvent({
          method: "POST",
          params: { uuid: datasetId },
          body: {
            dimensionKey: "year",
            dimensionValue: "2024",
            value: 99.9,
          },
          user: editorUser,
        }),
      )
      expect(response.status).toBe(201)

      const body = await response.json()
      expect(body.datapoint).toBeTruthy()
      expect(body.datapoint.value).toBe(99.9)
      expect(body.datapoint.datasetId).toBe(datasetId)
    })

    it("rejects creation when unauthenticated", async () => {
      const { POST } = await import(
        "$lib/../routes/stats/api/v1/datasets/[uuid]/datapoints/+server.ts"
      )
      const response = await POST(
        mockEvent({
          method: "POST",
          params: { uuid: datasetId },
          body: { dimensionKey: "year", value: 10 },
          user: null,
        }),
      )
      expect(response.status).toBe(401)
    })

    it("rejects invalid datapoint data", async () => {
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const { POST } = await import(
        "$lib/../routes/stats/api/v1/datasets/[uuid]/datapoints/+server.ts"
      )
      const response = await POST(
        mockEvent({
          method: "POST",
          params: { uuid: datasetId },
          body: { value: "not-a-number" },
          user: editorUser,
        }),
      )
      // Zod validation should reject because value is required and must be a number
      expect(response.status).toBe(400)
    })

    it("rejects bulk import exceeding limit", async () => {
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      // Create 5001 items (exceeds DATAPOINT_BULK_MAX = 5000)
      const bulkData = Array.from({ length: 5001 }, (_, i) => ({
        dimensionKey: "year",
        dimensionValue: String(2024 + i),
        value: i,
      }))

      const { POST } = await import(
        "$lib/../routes/stats/api/v1/datasets/[uuid]/datapoints/+server.ts"
      )
      const response = await POST(
        mockEvent({
          method: "POST",
          params: { uuid: datasetId },
          body: bulkData,
          user: editorUser,
        }),
      )
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain("5000")
    })

    it("creates bulk datapoints when within limit", async () => {
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const bulkData = Array.from({ length: 3 }, (_, i) => ({
        dimensionKey: "year",
        dimensionValue: String(2020 + i),
        value: i + 10,
      }))

      const { POST } = await import(
        "$lib/../routes/stats/api/v1/datasets/[uuid]/datapoints/+server.ts"
      )
      const response = await POST(
        mockEvent({
          method: "POST",
          params: { uuid: datasetId },
          body: bulkData,
          user: editorUser,
        }),
      )
      expect(response.status).toBe(201)

      const body = await response.json()
      expect(body.datapoints).toHaveLength(3)
    })
  })
})
