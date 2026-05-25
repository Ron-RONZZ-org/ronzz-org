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
    params: {},
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

/**
 * Create only the tables needed for dataset API tests.
 */
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
      CREATE TABLE "user" (
        "id" text PRIMARY KEY NOT NULL,
        "email" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" text NOT NULL DEFAULT 'editor',
        "password_change_required" integer NOT NULL DEFAULT 0,
        "created_at" text NOT NULL
      );
      CREATE TABLE "api_token" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "name" text NOT NULL,
        "token_hash" text NOT NULL,
        "prefix" text NOT NULL,
        "revoked_at" text,
        "created_at" text NOT NULL,
        "last_used_at" text
      );
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
  }
}

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
