import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"
import { mockEvent } from "../helpers/mock-event"

describe("Admin Datasets API", () => {
  let db: Database
  let datasetId: string

  beforeEach(async () => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    db = getDb() as Database
    createTestTables(db)

    // Create a dataset to work with
    const { createDataset } = await import("@ronzz/ronstats-core")
    const result = await createDataset(db, { title: "Admin Test Dataset" })
    if (result.ok) {
      datasetId = result.value.id
    }
  })

  describe("DELETE /stats/api/v1/admin/datasets", () => {
    it("rejects non-admin users", async () => {
      const { DELETE } = await import("$lib/../routes/stats/api/v1/admin/datasets/+server.ts")
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const response = await DELETE(
        mockEvent({
          method: "DELETE",
          body: { ids: [datasetId] },
          user: editorUser,
        }),
      )
      expect(response.status).toBe(403)
    })

    it("rejects unauthenticated requests", async () => {
      const { DELETE } = await import("$lib/../routes/stats/api/v1/admin/datasets/+server.ts")

      const response = await DELETE(
        mockEvent({
          method: "DELETE",
          body: { ids: [datasetId] },
          user: null,
        }),
      )
      expect(response.status).toBe(401)
    })
  })

  describe("GET /stats/api/v1/admin/datasets/trash", () => {
    it("rejects non-admin users", async () => {
      const { GET } = await import("$lib/../routes/stats/api/v1/admin/datasets/trash/+server.ts")
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const response = await GET(mockEvent({ user: editorUser }))
      expect(response.status).toBe(403)
    })

    it("returns empty trash when admin", async () => {
      const { GET } = await import("$lib/../routes/stats/api/v1/admin/datasets/trash/+server.ts")
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const response = await GET(mockEvent({ user: adminUser }))
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.datasets).toEqual([])
      expect(body.total).toBe(0)
    })
  })
})
