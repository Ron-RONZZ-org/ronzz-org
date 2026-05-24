import { describe, it, expect, beforeEach } from "vitest"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as sqliteSchema from "database/schema/sqlite/index"
import {
  listResources,
  getResource,
  createResource,
  deleteResource,
  listTrashResources,
  restoreResource,
  hardDeleteResource,
} from "@ronzz/ronlib-core"
import type { ResourceInput } from "@ronzz/ronlib-core"

function createTestDb() {
  const sqlite = new Database(":memory:")
  sqlite.exec(`
    CREATE TABLE "resource_type" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "name_fr" text NOT NULL,
      "name_eo" text NOT NULL,
      "name_en" text NOT NULL
    );
    CREATE TABLE "resource" (
      "id" text PRIMARY KEY NOT NULL,
      "type_id" text NOT NULL REFERENCES "resource_type"("id"),
      "title" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "url" text NOT NULL,
      "locale" text NOT NULL DEFAULT 'fr',
      "metadata" text DEFAULT '{}',
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL,
      "deleted_at" text
    );
  `)
  return drizzle(sqlite, { schema: sqliteSchema })
}

const typeId = "book-type"
const sampleInput: ResourceInput = {
  typeId,
  title: "Test Resource",
  description: "A test resource",
  url: "https://example.com/book",
  locale: "fr",
  metadata: { author: "Test Author" },
}

describe("resources queries", () => {
  let db: ReturnType<typeof createTestDb>

  beforeEach(() => {
    db = createTestDb()
    // Seed a resource type
    db.insert(sqliteSchema.resourceTypes).values({
      id: typeId,
      slug: "book",
      nameFr: "Livre",
      nameEo: "Libro",
      nameEn: "Book",
    }).run()
  })

  describe("createResource", () => {
    it("creates a resource with all fields", async () => {
      const result = await createResource(db as any, sampleInput)

      expect(result.id).toBeTruthy()
      expect(result.title).toBe("Test Resource")
      expect(result.description).toBe("A test resource")
      expect(result.url).toBe("https://example.com/book")
      expect(result.typeId).toBe(typeId)
      expect(result.locale).toBe("fr")
      expect(result.metadata).toEqual({ author: "Test Author" })
      expect(result.deletedAt).toBeNull()
    })

    it("uses defaults for optional fields", async () => {
      const result = await createResource(db as any, {
        typeId,
        title: "Minimal",
        url: "https://example.com/minimal",
      })

      expect(result.description).toBe("")
      expect(result.locale).toBe("fr")
      expect(result.metadata).toEqual({})
    })
  })

  describe("listResources", () => {
    it("returns empty list when no resources exist", async () => {
      const { resources, total } = await listResources(db as any)
      expect(resources).toEqual([])
      expect(total).toBe(0)
    })

    it("lists all non-deleted resources", async () => {
      await createResource(db as any, sampleInput)
      await createResource(db as any, { ...sampleInput, title: "Second" })

      const { resources, total } = await listResources(db as any)
      expect(total).toBe(2)
      expect(resources).toHaveLength(2)
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await createResource(db as any, { ...sampleInput, title: `Resource ${i}` })
      }

      const { resources, total } = await listResources(db as any, { limit: 2, offset: 1 })
      expect(total).toBe(5)
      expect(resources).toHaveLength(2)
    })

    it("filters by search term", async () => {
      await createResource(db as any, { ...sampleInput, title: "Alpha" })
      await createResource(db as any, { ...sampleInput, title: "Beta" })
      await createResource(db as any, { ...sampleInput, title: "Alpha Prime" })

      const { resources, total } = await listResources(db as any, { search: "Alpha" })
      expect(total).toBe(2)
      expect(resources.map((r) => r.title).sort()).toEqual(["Alpha", "Alpha Prime"])
    })

    it("filters by locale", async () => {
      await createResource(db as any, { ...sampleInput, locale: "fr" })
      await createResource(db as any, { ...sampleInput, locale: "en" })
      await createResource(db as any, { ...sampleInput, locale: "eo" })

      const { resources, total } = await listResources(db as any, { locale: "fr" })
      expect(total).toBe(1)
      expect(resources[0].locale).toBe("fr")
    })
  })

  describe("getResource", () => {
    it("returns undefined for non-existent resource", async () => {
      const result = await getResource(db as any, "non-existent")
      expect(result).toBeUndefined()
    })

    it("returns a resource by id", async () => {
      const created = await createResource(db as any, sampleInput)
      const result = await getResource(db as any, created.id)
      expect(result).toBeTruthy()
      expect(result!.title).toBe("Test Resource")
    })

    it("returns undefined for soft-deleted resource", async () => {
      const created = await createResource(db as any, sampleInput)
      await deleteResource(db as any, created.id)

      const result = await getResource(db as any, created.id)
      expect(result).toBeUndefined()
    })
  })

  describe("deleteResource (soft-delete)", () => {
    it("soft-deletes a resource", async () => {
      const created = await createResource(db as any, sampleInput)
      const deleted = await deleteResource(db as any, created.id)

      expect(deleted).toBe(true)
      const { resources, total } = await listResources(db as any)
      expect(total).toBe(0)
    })

    it("returns false for already deleted resource", async () => {
      const created = await createResource(db as any, sampleInput)
      await deleteResource(db as any, created.id)
      const result = await deleteResource(db as any, created.id)
      expect(result).toBe(false)
    })

    it("returns false for non-existent resource", async () => {
      const result = await deleteResource(db as any, "non-existent")
      expect(result).toBe(false)
    })
  })

  describe("listTrashResources", () => {
    it("lists soft-deleted resources", async () => {
      await createResource(db as any, sampleInput)
      const created2 = await createResource(db as any, { ...sampleInput, title: "To Delete" })
      await deleteResource(db as any, created2.id)

      const trash = await listTrashResources(db as any)
      expect(trash).toHaveLength(1)
      expect(trash[0].title).toBe("To Delete")
    })
  })

  describe("restoreResource", () => {
    it("restores a soft-deleted resource", async () => {
      const created = await createResource(db as any, sampleInput)
      await deleteResource(db as any, created.id)
      const restored = await restoreResource(db as any, created.id)

      expect(restored).toBe(true)
      const { resources, total } = await listResources(db as any)
      expect(total).toBe(1)
    })
  })

  describe("hardDeleteResource", () => {
    it("permanently deletes a resource", async () => {
      const created = await createResource(db as any, sampleInput)
      const deleted = await hardDeleteResource(db as any, created.id)

      expect(deleted).toBe(true)
      const { resources, total } = await listResources(db as any)
      expect(total).toBe(0)
    })
  })
})
