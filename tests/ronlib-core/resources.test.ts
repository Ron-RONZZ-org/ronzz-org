import {
  createResource,
  deleteResource,
  getResource,
  hardDeleteResource,
  listResources,
  listTrashResources,
  restoreResource,
} from "@ronzz/ronlib-core"
import type { ResourceInput } from "@ronzz/ronlib-core"
import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { schema } from "database/schema/proxy"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"

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
  let db: Database

  beforeEach(() => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    db = getDb() as Database
    createTestTables(db)
    // Seed a resource type
    db.insert(schema.resourceTypes)
      .values({
        id: typeId,
        slug: "book",
        nameFr: "Livre",
        nameEo: "Libro",
        nameEn: "Book",
      })
      .run()
  })

  describe("createResource", () => {
    it("creates a resource with all fields", async () => {
      const result = await createResource(db, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.id).toBeTruthy()
      expect(result.value.title).toBe("Test Resource")
      expect(result.value.description).toBe("A test resource")
      expect(result.value.url).toBe("https://example.com/book")
      expect(result.value.typeId).toBe(typeId)
      expect(result.value.locale).toBe("fr")
      expect(result.value.metadata).toEqual({ author: "Test Author" })
      expect(result.value.deletedAt).toBeNull()
    })

    it("uses defaults for optional fields", async () => {
      const result = await createResource(db, {
        typeId,
        title: "Minimal",
        url: "https://example.com/minimal",
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.description).toBe("")
      expect(result.value.locale).toBe("fr")
      expect(result.value.metadata).toEqual({})
    })
  })

  describe("listResources", () => {
    it("returns empty list when no resources exist", async () => {
      const { resources, total } = await listResources(db)
      expect(resources).toEqual([])
      expect(total).toBe(0)
    })

    it("lists all non-deleted resources", async () => {
      const r1 = await createResource(db, sampleInput)
      expect(r1.ok).toBe(true)
      const r2 = await createResource(db, { ...sampleInput, title: "Second" })
      expect(r2.ok).toBe(true)

      const { resources, total } = await listResources(db)
      expect(total).toBe(2)
      expect(resources).toHaveLength(2)
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        const r = await createResource(db, { ...sampleInput, title: `Resource ${i}` })
        expect(r.ok).toBe(true)
      }

      const { resources, total } = await listResources(db, { limit: 2, offset: 1 })
      expect(total).toBe(5)
      expect(resources).toHaveLength(2)
    })

    it("filters by search term", async () => {
      const r1 = await createResource(db, { ...sampleInput, title: "Alpha" })
      expect(r1.ok).toBe(true)
      const r2 = await createResource(db, { ...sampleInput, title: "Beta" })
      expect(r2.ok).toBe(true)
      const r3 = await createResource(db, { ...sampleInput, title: "Alpha Prime" })
      expect(r3.ok).toBe(true)

      const { resources, total } = await listResources(db, { search: "Alpha" })
      expect(total).toBe(2)
      expect(resources.map((r) => r.title).sort()).toEqual(["Alpha", "Alpha Prime"])
    })

    it("filters by locale", async () => {
      const r1 = await createResource(db, { ...sampleInput, locale: "fr" })
      expect(r1.ok).toBe(true)
      const r2 = await createResource(db, { ...sampleInput, locale: "en" })
      expect(r2.ok).toBe(true)
      const _r3 = await createResource(db, { ...sampleInput, locale: "eo" })

      const { resources, total } = await listResources(db, { locale: "fr" })
      expect(total).toBe(1)
      expect(resources[0].locale).toBe("fr")
    })
  })

  describe("getResource", () => {
    it("returns undefined for non-existent resource", async () => {
      const result = await getResource(db, "non-existent")
      expect(result).toBeUndefined()
    })

    it("returns a resource by id", async () => {
      const created = await createResource(db, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      const result = await getResource(db, created.value.id)
      expect(result).toBeTruthy()
      expect(result?.title).toBe("Test Resource")
    })

    it("returns undefined for soft-deleted resource", async () => {
      const created = await createResource(db, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      await deleteResource(db, created.value.id)

      const result = await getResource(db, created.value.id)
      expect(result).toBeUndefined()
    })
  })

  describe("deleteResource (soft-delete)", () => {
    it("soft-deletes a resource", async () => {
      const created = await createResource(db, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      const deleted = await deleteResource(db, created.value.id)
      expect(deleted).toMatchObject({ ok: true, value: true })

      const { resources, total } = await listResources(db)
      expect(total).toBe(0)
    })

    it("returns false for already deleted resource", async () => {
      const created = await createResource(db, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      await deleteResource(db, created.value.id)
      const result = await deleteResource(db, created.value.id)
      expect(result).toMatchObject({ ok: true, value: false })
    })

    it("returns false for non-existent resource", async () => {
      const result = await deleteResource(db, "non-existent")
      expect(result).toMatchObject({ ok: true, value: false })
    })
  })

  describe("listTrashResources", () => {
    it("lists soft-deleted resources", async () => {
      const r1 = await createResource(db, sampleInput)
      expect(r1.ok).toBe(true)

      const created2 = await createResource(db, { ...sampleInput, title: "To Delete" })
      expect(created2.ok).toBe(true)
      if (!created2.ok) return

      await deleteResource(db, created2.value.id)

      const trash = await listTrashResources(db)
      expect(trash.resources).toHaveLength(1)
      expect(trash.total).toBe(1)
      expect(trash.resources[0].title).toBe("To Delete")
    })
  })

  describe("restoreResource", () => {
    it("restores a soft-deleted resource", async () => {
      const created = await createResource(db, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      await deleteResource(db, created.value.id)
      const restored = await restoreResource(db, created.value.id)
      expect(restored).toMatchObject({ ok: true, value: true })

      const { resources, total } = await listResources(db)
      expect(total).toBe(1)
    })
  })

  describe("hardDeleteResource", () => {
    it("permanently deletes a resource", async () => {
      const created = await createResource(db, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      const deleted = await hardDeleteResource(db, created.value.id)
      expect(deleted).toMatchObject({ ok: true, value: true })

      const { resources, total } = await listResources(db)
      expect(total).toBe(0)
    })
  })
})
