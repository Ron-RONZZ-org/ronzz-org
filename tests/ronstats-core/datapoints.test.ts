import { describe, it, expect, beforeEach } from "vitest"
import type Database from "better-sqlite3"
import BetterSqlite3 from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as sqliteSchema from "database/schema/sqlite/index"
import {
  listDatapoints,
  countDatapoints,
  createDatapoint,
  bulkCreateDatapoints,
} from "@ronzz/ronstats-core"
import type { DatapointInput } from "@ronzz/ronstats-core"

function createTestDb() {
  const sqlite = new BetterSqlite3(":memory:")
  sqlite.exec(`
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
  return drizzle(sqlite, { schema: sqliteSchema })
}

const sampleInput: DatapointInput = {
  datasetId: "ds-1",
  dimensionKey: "year",
  dimensionValue: "2024",
  value: 42.5,
  unit: "%",
  year: "2024",
  metadata: { source: "test" },
}

function unwrap<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok) throw new Error("Expected ok result")
  return result.value!
}

describe("datapoints queries", () => {
  let db: ReturnType<typeof drizzle>

  beforeEach(() => {
    db = createTestDb()
  })

  describe("createDatapoint", () => {
    it("creates a datapoint with all fields", async () => {
      const dp = unwrap(await createDatapoint(db as never, sampleInput))

      expect(dp.id).toBeTruthy()
      expect(dp.datasetId).toBe("ds-1")
      expect(dp.dimensionKey).toBe("year")
      expect(dp.dimensionValue).toBe("2024")
      expect(dp.value).toBe(42.5)
      expect(dp.unit).toBe("%")
      expect(dp.year).toBe("2024")
      expect(dp.metadata).toEqual({ source: "test" })
      expect(dp.createdAt).toBeTruthy()
    })

    it("uses defaults for optional fields", async () => {
      const dp = unwrap(await createDatapoint(db as never, {
        datasetId: "ds-1",
        value: 10,
      }))

      expect(dp.dimensionKey).toBe("")
      expect(dp.dimensionValue).toBe("")
      expect(dp.unit).toBe("")
      expect(dp.year).toBe("")
      expect(dp.metadata).toEqual({})
    })
  })

  describe("listDatapoints", () => {
    it("returns empty list when no datapoints exist", async () => {
      const result = await listDatapoints(db as never, "ds-1")
      expect(result).toEqual([])
    })

    it("lists all datapoints for a dataset in descending order by createdAt", async () => {
      await createDatapoint(db as never, {
        datasetId: "ds-1",
        dimensionKey: "first",
        dimensionValue: "a",
        value: 1,
      })

      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10))

      await createDatapoint(db as never, {
        datasetId: "ds-1",
        dimensionKey: "second",
        dimensionValue: "b",
        value: 2,
      })

      const result = await listDatapoints(db as never, "ds-1")
      expect(result).toHaveLength(2)
      // Most recent first (ORDER BY createdAt DESC)
      expect(result[0].dimensionKey).toBe("second")
      expect(result[1].dimensionKey).toBe("first")
    })

    it("only returns datapoints for the specified dataset", async () => {
      await createDatapoint(db as never, { datasetId: "ds-1", value: 1 })
      await createDatapoint(db as never, { datasetId: "ds-2", value: 2 })

      const result = await listDatapoints(db as never, "ds-1")
      expect(result).toHaveLength(1)
      expect(result[0].datasetId).toBe("ds-1")
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await createDatapoint(db as never, {
          datasetId: "ds-1",
          dimensionKey: `key-${i}`,
          value: i,
        })
      }

      const all = await listDatapoints(db as never, "ds-1")
      expect(all).toHaveLength(5)

      const limited = await listDatapoints(db as never, "ds-1", {
        limit: 2,
        offset: 1,
      })
      expect(limited).toHaveLength(2)
    })
  })

  describe("countDatapoints", () => {
    it("returns 0 when no datapoints exist", async () => {
      const total = await countDatapoints(db as never, "ds-1")
      expect(total).toBe(0)
    })

    it("counts datapoints for a specific dataset", async () => {
      await createDatapoint(db as never, { datasetId: "ds-1", value: 1 })
      await createDatapoint(db as never, { datasetId: "ds-1", value: 2 })
      await createDatapoint(db as never, { datasetId: "ds-2", value: 3 })

      const total = await countDatapoints(db as never, "ds-1")
      expect(total).toBe(2)
    })
  })

  describe("bulkCreateDatapoints", () => {
    it("creates multiple datapoints", async () => {
      const inputs: DatapointInput[] = [
        { datasetId: "ds-1", value: 10 },
        { datasetId: "ds-1", value: 20 },
        { datasetId: "ds-1", value: 30 },
      ]

      const results = unwrap(await bulkCreateDatapoints(db as never, inputs))
      expect(results).toHaveLength(3)
      expect(results[0].datasetId).toBe("ds-1")
      expect(results[1].value).toBe(20)

      const total = await countDatapoints(db as never, "ds-1")
      expect(total).toBe(3)
    })
  })
})
