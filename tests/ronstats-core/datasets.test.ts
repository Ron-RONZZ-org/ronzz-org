import { describe, it, expect, beforeEach } from "vitest"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as sqliteSchema from "database/schema/sqlite/index"
import {
  listDatasets,
  getDataset,
  createDataset,
  softDeleteDataset,
  listTrashDatasets,
  restoreDataset,
  hardDeleteDataset,
} from "@ronzz/ronstats-core"
import type { DatasetInput } from "@ronzz/ronstats-core"

function createTestDb() {
  const sqlite = new Database(":memory:")
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
      "dataset_id" text NOT NULL REFERENCES "dataset"("id"),
      "dimension_key" text NOT NULL DEFAULT '',
      "dimension_value" text NOT NULL DEFAULT '',
      "value" real NOT NULL DEFAULT 0,
      "unit" text NOT NULL DEFAULT '',
      "year" text NOT NULL DEFAULT '',
      "metadata" text DEFAULT '{}',
      "created_at" text NOT NULL
    );
  `)
  return drizzle(sqlite, { schema: sqliteSchema })
}

const sampleInput: DatasetInput = {
  title: "Test Dataset",
  description: "A test dataset",
  source: "Test Source",
  sourceUrl: "https://example.com",
  license: "MIT",
  locale: "fr",
  chartType: "bar",
  metadata: { key: "value" },
}

describe("datasets queries", () => {
  let db: ReturnType<typeof createTestDb>

  beforeEach(() => {
    db = createTestDb()
  })

  describe("createDataset", () => {
    it("creates a dataset with all fields", async () => {
      const result = await createDataset(db as any, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      const ds = result.value

      expect(ds.id).toBeTruthy()
      expect(ds.title).toBe("Test Dataset")
      expect(ds.description).toBe("A test dataset")
      expect(ds.source).toBe("Test Source")
      expect(ds.locale).toBe("fr")
      expect(ds.chartType).toBe("bar")
      expect(ds.metadata).toEqual({ key: "value" })
      expect(ds.deletedAt).toBeNull()
      expect(ds.createdAt).toBeTruthy()
      expect(ds.updatedAt).toBeTruthy()
    })

    it("uses defaults for optional fields", async () => {
      const result = await createDataset(db as any, { title: "Minimal" })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.value.title).toBe("Minimal")
      expect(result.value.description).toBe("")
      expect(result.value.locale).toBe("fr")
      expect(result.value.chartType).toBe("bar")
      expect(result.value.metadata).toEqual({})
    })
  })

  describe("listDatasets", () => {
    it("returns empty list when no datasets exist", async () => {
      const { datasets, total } = await listDatasets(db as any)
      expect(datasets).toEqual([])
      expect(total).toBe(0)
    })

    it("lists all non-deleted datasets", async () => {
      const r1 = await createDataset(db as any, sampleInput)
      expect(r1.ok).toBe(true)
      const r2 = await createDataset(db as any, { ...sampleInput, title: "Second" })
      expect(r2.ok).toBe(true)

      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(2)
      expect(datasets).toHaveLength(2)
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        const r = await createDataset(db as any, { ...sampleInput, title: `Dataset ${i}` })
        expect(r.ok).toBe(true)
      }

      const { datasets, total } = await listDatasets(db as any, { limit: 2, offset: 1 })
      expect(total).toBe(5)
      expect(datasets).toHaveLength(2)
    })

    it("filters by search term", async () => {
      const r1 = await createDataset(db as any, { ...sampleInput, title: "Alpha" })
      expect(r1.ok).toBe(true)
      const r2 = await createDataset(db as any, { ...sampleInput, title: "Beta" })
      expect(r2.ok).toBe(true)
      const r3 = await createDataset(db as any, { ...sampleInput, title: "Alpha Prime" })
      expect(r3.ok).toBe(true)

      const { datasets, total } = await listDatasets(db as any, { search: "Alpha" })
      expect(total).toBe(2)
      expect(datasets.map((d) => d.title).sort()).toEqual(["Alpha", "Alpha Prime"])
    })

    it("filters by locale", async () => {
      const r1 = await createDataset(db as any, { ...sampleInput, locale: "fr" })
      expect(r1.ok).toBe(true)
      const r2 = await createDataset(db as any, { ...sampleInput, locale: "en" })
      expect(r2.ok).toBe(true)
      const r3 = await createDataset(db as any, { ...sampleInput, locale: "eo" })

      const { datasets, total } = await listDatasets(db as any, { locale: "fr" })
      expect(total).toBe(1)
      expect(datasets[0].locale).toBe("fr")
    })

    it("includes soft-deleted datasets when includeTrash is true", async () => {
      const created = await createDataset(db as any, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      await softDeleteDataset(db as any, created.value.id)

      // Default: trash excluded
      const { total: totalActive } = await listDatasets(db as any)
      expect(totalActive).toBe(0)

      // With includeTrash: trash included
      const { datasets, total } = await listDatasets(db as any, { includeTrash: true })
      expect(total).toBe(1)
      expect(datasets[0].title).toBe("Test Dataset")
    })
  })

  describe("getDataset", () => {
    it("returns undefined for non-existent dataset", async () => {
      const result = await getDataset(db as any, "non-existent")
      expect(result).toBeUndefined()
    })

    it("returns a dataset by id", async () => {
      const created = await createDataset(db as any, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      const result = await getDataset(db as any, created.value.id)
      expect(result).toBeTruthy()
      expect(result!.title).toBe("Test Dataset")
    })

    it("returns undefined for soft-deleted dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      await softDeleteDataset(db as any, created.value.id)

      const result = await getDataset(db as any, created.value.id)
      expect(result).toBeUndefined()
    })
  })

  describe("softDeleteDataset", () => {
    it("soft-deletes a dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      const deleted = await softDeleteDataset(db as any, created.value.id)
      expect(deleted).toMatchObject({ ok: true, value: true })

      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(0)
    })

    it("returns false for already deleted dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      await softDeleteDataset(db as any, created.value.id)
      const result = await softDeleteDataset(db as any, created.value.id)
      expect(result).toMatchObject({ ok: true, value: false })
    })

    it("returns false for non-existent dataset", async () => {
      const result = await softDeleteDataset(db as any, "non-existent")
      expect(result).toMatchObject({ ok: true, value: false })
    })
  })

  describe("listTrashDatasets", () => {
    it("lists soft-deleted datasets", async () => {
      await createDataset(db as any, sampleInput)

      const created2 = await createDataset(db as any, { ...sampleInput, title: "To Delete" })
      expect(created2.ok).toBe(true)
      if (!created2.ok) return

      await softDeleteDataset(db as any, created2.value.id)

      const trash = await listTrashDatasets(db as any)
      expect(trash.datasets).toHaveLength(1)
      expect(trash.total).toBe(1)
      expect(trash.datasets[0].title).toBe("To Delete")
    })
  })

  describe("restoreDataset", () => {
    it("restores a soft-deleted dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      await softDeleteDataset(db as any, created.value.id)
      const restored = await restoreDataset(db as any, created.value.id)
      expect(restored).toMatchObject({ ok: true, value: true })

      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(1)
    })
  })

  describe("hardDeleteDataset", () => {
    it("permanently deletes a dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      expect(created.ok).toBe(true)
      if (!created.ok) return

      const deleted = await hardDeleteDataset(db as any, created.value.id)
      expect(deleted).toMatchObject({ ok: true, value: true })

      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(0)
    })
  })
})
