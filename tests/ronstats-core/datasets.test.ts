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

      expect(result.id).toBeTruthy()
      expect(result.title).toBe("Test Dataset")
      expect(result.description).toBe("A test dataset")
      expect(result.source).toBe("Test Source")
      expect(result.locale).toBe("fr")
      expect(result.chartType).toBe("bar")
      expect(result.metadata).toEqual({ key: "value" })
      expect(result.deletedAt).toBeNull()
      expect(result.createdAt).toBeTruthy()
      expect(result.updatedAt).toBeTruthy()
    })

    it("uses defaults for optional fields", async () => {
      const result = await createDataset(db as any, { title: "Minimal" })

      expect(result.title).toBe("Minimal")
      expect(result.description).toBe("")
      expect(result.locale).toBe("fr")
      expect(result.chartType).toBe("bar")
      expect(result.metadata).toEqual({})
    })
  })

  describe("listDatasets", () => {
    it("returns empty list when no datasets exist", async () => {
      const { datasets, total } = await listDatasets(db as any)
      expect(datasets).toEqual([])
      expect(total).toBe(0)
    })

    it("lists all non-deleted datasets", async () => {
      await createDataset(db as any, sampleInput)
      await createDataset(db as any, { ...sampleInput, title: "Second" })

      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(2)
      expect(datasets).toHaveLength(2)
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await createDataset(db as any, { ...sampleInput, title: `Dataset ${i}` })
      }

      const { datasets, total } = await listDatasets(db as any, { limit: 2, offset: 1 })
      expect(total).toBe(5)
      expect(datasets).toHaveLength(2)
    })

    it("filters by search term", async () => {
      await createDataset(db as any, { ...sampleInput, title: "Alpha" })
      await createDataset(db as any, { ...sampleInput, title: "Beta" })
      await createDataset(db as any, { ...sampleInput, title: "Alpha Prime" })

      const { datasets, total } = await listDatasets(db as any, { search: "Alpha" })
      expect(total).toBe(2)
      expect(datasets.map((d) => d.title).sort()).toEqual(["Alpha", "Alpha Prime"])
    })

    it("filters by locale", async () => {
      await createDataset(db as any, { ...sampleInput, locale: "fr" })
      await createDataset(db as any, { ...sampleInput, locale: "en" })
      await createDataset(db as any, { ...sampleInput, locale: "eo" })

      const { datasets, total } = await listDatasets(db as any, { locale: "fr" })
      expect(total).toBe(1)
      expect(datasets[0].locale).toBe("fr")
    })
  })

  describe("getDataset", () => {
    it("returns undefined for non-existent dataset", async () => {
      const result = await getDataset(db as any, "non-existent")
      expect(result).toBeUndefined()
    })

    it("returns a dataset by id", async () => {
      const created = await createDataset(db as any, sampleInput)
      const result = await getDataset(db as any, created.id)
      expect(result).toBeTruthy()
      expect(result!.title).toBe("Test Dataset")
    })

    it("returns undefined for soft-deleted dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      await softDeleteDataset(db as any, created.id)

      const result = await getDataset(db as any, created.id)
      expect(result).toBeUndefined()
    })
  })

  describe("softDeleteDataset", () => {
    it("soft-deletes a dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      const deleted = await softDeleteDataset(db as any, created.id)

      expect(deleted).toBe(true)
      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(0)
    })

    it("returns false for already deleted dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      await softDeleteDataset(db as any, created.id)
      const result = await softDeleteDataset(db as any, created.id)
      expect(result).toBe(false)
    })

    it("returns false for non-existent dataset", async () => {
      const result = await softDeleteDataset(db as any, "non-existent")
      expect(result).toBe(false)
    })
  })

  describe("listTrashDatasets", () => {
    it("lists soft-deleted datasets", async () => {
      await createDataset(db as any, sampleInput)
      const created2 = await createDataset(db as any, { ...sampleInput, title: "To Delete" })
      await softDeleteDataset(db as any, created2.id)

      const trash = await listTrashDatasets(db as any)
      expect(trash).toHaveLength(1)
      expect(trash[0].title).toBe("To Delete")
    })
  })

  describe("restoreDataset", () => {
    it("restores a soft-deleted dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      await softDeleteDataset(db as any, created.id)
      const restored = await restoreDataset(db as any, created.id)

      expect(restored).toBe(true)
      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(1)
    })
  })

  describe("hardDeleteDataset", () => {
    it("permanently deletes a dataset", async () => {
      const created = await createDataset(db as any, sampleInput)
      const deleted = await hardDeleteDataset(db as any, created.id)

      expect(deleted).toBe(true)
      const { datasets, total } = await listDatasets(db as any)
      expect(total).toBe(0)
    })
  })
})
