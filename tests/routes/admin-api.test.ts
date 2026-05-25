import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, getDb } from "database/db"
import type { Database } from "database/db-types"

/**
 * Minimal SvelteKit RequestEvent-like object for handler testing.
 */
function mockEvent(overrides?: {
  url?: string
  method?: string
  body?: unknown
  headers?: Record<string, string>
  user?: { id: string; email: string; role: "admin" | "editor" } | null
  params?: Record<string, string>
}): any {
  const url = new URL(overrides?.url ?? "http://localhost:5173/")
  const body = overrides?.body !== undefined ? JSON.stringify(overrides.body) : null
  return {
    request: new Request(url, {
      method: overrides?.method ?? "GET",
      headers: overrides?.headers ?? {},
      body,
    }),
    url,
    params: overrides?.params ?? {},
    locals: {
      user: overrides?.user ?? null,
      locale: "fr",
      requestId: "test",
      nonce: "test-nonce",
    },
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
    },
  }
}

function createTestTables(db: Database): void {
  // biome-ignore lint/suspicious/noExplicitAny: need access to underlying SQLite connection
  const sqlite = (db as any).session?.client as any
  if (sqlite?.exec) {
    sqlite.exec(`
      CREATE TABLE "dataset" (
        "id" text PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "source" text NOT NULL DEFAULT '',
        "source_url" text NOT NULL DEFAULT '',
        "license" text NOT NULL DEFAULT '',
        "locale" text NOT NULL DEFAULT 'fr',
        "chart_type" text NOT NULL DEFAULT 'bar',
        "metadata" text DEFAULT '{}',
        "created_at" text NOT NULL,
        "updated_at" text NOT NULL,
        "deleted_at" text
      );
      CREATE TABLE "datapoint" (
        "id" text PRIMARY KEY NOT NULL,
        "dataset_id" text NOT NULL,
        "dimension_key" text NOT NULL DEFAULT '',
        "dimension_value" text NOT NULL DEFAULT '',
        "value" real NOT NULL DEFAULT 0,
        "unit" text NOT NULL DEFAULT '',
        "year" text NOT NULL DEFAULT '',
        "metadata" text DEFAULT '{}',
        "created_at" text NOT NULL
      );
    `)
  }
}

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
      const { GET } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/trash/+server.ts"
      )
      const editorUser = { id: "editor-1", email: "editor@test.com", role: "editor" as const }

      const response = await GET(mockEvent({ user: editorUser }))
      expect(response.status).toBe(403)
    })

    it("returns empty trash when admin", async () => {
      const { GET } = await import(
        "$lib/../routes/stats/api/v1/admin/datasets/trash/+server.ts"
      )
      const adminUser = { id: "admin-1", email: "admin@test.com", role: "admin" as const }

      const response = await GET(mockEvent({ user: adminUser }))
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.datasets).toEqual([])
      expect(body.total).toBe(0)
    })
  })
})
