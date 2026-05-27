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

  describe("POST /stats/api/v1/admin/datasets/[id]/restore", () => {
    it("rejects non-admin users", async () => {
      const { POST } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/restore/+server.ts"
      )
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const response = await POST(
        mockEvent({
          method: "POST",
          params: { id: datasetId },
          user: editorUser,
        }),
      )
      expect(response.status).toBe(403)
    })

    it("rejects unauthenticated requests", async () => {
      const { POST } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/restore/+server.ts"
      )

      const response = await POST(
        mockEvent({
          method: "POST",
          params: { id: datasetId },
          user: null,
        }),
      )
      expect(response.status).toBe(401)
    })

    it("returns 404 for non-existent dataset", async () => {
      const { POST } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/restore/+server.ts"
      )
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const response = await POST(
        mockEvent({
          method: "POST",
          params: { id: "nonexistent-id" },
          user: adminUser,
        }),
      )
      expect(response.status).toBe(404)

      const body = await response.json()
      expect(body.error).toBe("Not found")
    })

    it("restores a trashed dataset when admin", async () => {
      // First, soft-delete the dataset
      const { DELETE: softDelete } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/+server.ts"
      )
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const deleteResponse = await softDelete(
        mockEvent({
          method: "DELETE",
          params: { id: datasetId },
          user: adminUser,
        }),
      )
      expect(deleteResponse.status).toBe(204)

      // Verify it's in trash
      const { GET: trashGet } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/trash/+server.ts"
      )
      const trashResponse = await trashGet(mockEvent({ user: adminUser }))
      const trashBody = await trashResponse.json()
      expect(trashBody.total).toBe(1)

      // Now restore it
      const { POST } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/restore/+server.ts"
      )
      const restoreResponse = await POST(
        mockEvent({
          method: "POST",
          params: { id: datasetId },
          user: adminUser,
        }),
      )
      expect(restoreResponse.status).toBe(200)

      const restoreBody = await restoreResponse.json()
      expect(restoreBody.restored).toBe(true)

      // Verify it's no longer in trash
      const trashResponse2 = await trashGet(mockEvent({ user: adminUser }))
      const trashBody2 = await trashResponse2.json()
      expect(trashBody2.total).toBe(0)
    })
  })

  describe("DELETE /stats/api/v1/admin/datasets/[id]/purge", () => {
    it("rejects non-admin users", async () => {
      const { DELETE } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/purge/+server.ts"
      )
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const response = await DELETE(
        mockEvent({
          method: "DELETE",
          params: { id: datasetId },
          user: editorUser,
        }),
      )
      expect(response.status).toBe(403)
    })

    it("rejects unauthenticated requests", async () => {
      const { DELETE } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/purge/+server.ts"
      )

      const response = await DELETE(
        mockEvent({
          method: "DELETE",
          params: { id: datasetId },
          user: null,
        }),
      )
      expect(response.status).toBe(401)
    })

    it("returns 404 for non-existent dataset", async () => {
      const { DELETE } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/purge/+server.ts"
      )
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const response = await DELETE(
        mockEvent({
          method: "DELETE",
          params: { id: "nonexistent-id" },
          user: adminUser,
        }),
      )
      expect(response.status).toBe(404)

      const body = await response.json()
      expect(body.error).toBe("Not found")
    })

    it("permanently deletes a trashed dataset when admin", async () => {
      // First, soft-delete the dataset
      const { DELETE: softDelete } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/+server.ts"
      )
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const deleteResponse = await softDelete(
        mockEvent({
          method: "DELETE",
          params: { id: datasetId },
          user: adminUser,
        }),
      )
      expect(deleteResponse.status).toBe(204)

      // Purge it
      const { DELETE } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/[id]/purge/+server.ts"
      )
      const purgeResponse = await DELETE(
        mockEvent({
          method: "DELETE",
          params: { id: datasetId },
          user: adminUser,
        }),
      )
      expect(purgeResponse.status).toBe(204)

      // Verify it's gone from trash too
      const { GET: trashGet } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/trash/+server.ts"
      )
      const trashResponse = await trashGet(mockEvent({ user: adminUser }))
      const trashBody = await trashResponse.json()
      expect(trashBody.total).toBe(0)
    })
  })
})
