import {
  bulkCreateDatapoints,
  countDatapoints,
  createDatapoint,
  createDataset,
  listDatapoints,
} from "@ronzz/ronstats-core"
import type { DatapointInput } from "@ronzz/ronstats-core"
import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"

function unwrap<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok) throw new Error("Expected ok result")
  return result.value!
}

describe("datapoints queries", () => {
  let db: Database
  // Real dataset ID created in beforeEach for FK compliance
  let datasetId: string

  beforeEach(async () => {
    vi.useFakeTimers()
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    db = getDb() as Database
    createTestTables(db)
    // Create a dataset so datapoint FK references resolve
    const ds = unwrap(await createDataset(db, { title: "Test Dataset" }))
    datasetId = ds.id
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("createDatapoint", () => {
    it("creates a datapoint with all fields", async () => {
      const dp = unwrap(
        await createDatapoint(db, {
          datasetId,
          dimensionKey: "year",
          dimensionValue: "2024",
          value: 42.5,
          unit: "%",
          year: "2024",
          metadata: { source: "test" },
        }),
      )

      expect(dp.id).toBeTruthy()
      expect(dp.datasetId).toBe(datasetId)
      expect(dp.dimensionKey).toBe("year")
      expect(dp.dimensionValue).toBe("2024")
      expect(dp.value).toBe(42.5)
      expect(dp.unit).toBe("%")
      expect(dp.year).toBe("2024")
      expect(dp.metadata).toEqual({ source: "test" })
      expect(dp.createdAt).toBeTruthy()
    })

    it("uses defaults for optional fields", async () => {
      const dp = unwrap(
        await createDatapoint(db, {
          datasetId,
          value: 10,
        }),
      )

      expect(dp.dimensionKey).toBe("")
      expect(dp.dimensionValue).toBe("")
      expect(dp.unit).toBe("")
      expect(dp.year).toBe("")
      expect(dp.metadata).toEqual({})
    })
  })

  describe("listDatapoints", () => {
    it("returns empty list when no datapoints exist", async () => {
      const result = await listDatapoints(db, datasetId)
      expect(result).toEqual([])
    })

    it("lists all datapoints for a dataset in descending order by createdAt", async () => {
      await createDatapoint(db, {
        datasetId,
        dimensionKey: "first",
        dimensionValue: "a",
        value: 1,
      })

      // Advance time to ensure different createdAt timestamps
      vi.advanceTimersByTime(1000)

      await createDatapoint(db, {
        datasetId,
        dimensionKey: "second",
        dimensionValue: "b",
        value: 2,
      })

      const result = await listDatapoints(db, datasetId)
      expect(result).toHaveLength(2)
      // Most recent first (ORDER BY createdAt DESC)
      expect(result[0].dimensionKey).toBe("second")
      expect(result[1].dimensionKey).toBe("first")
    })

    it("only returns datapoints for the specified dataset", async () => {
      // Create a second dataset
      const ds2 = unwrap(await createDataset(db, { title: "Second Dataset" }))

      await createDatapoint(db, { datasetId, value: 1 })
      await createDatapoint(db, { datasetId: ds2.id, value: 2 })

      const result = await listDatapoints(db, datasetId)
      expect(result).toHaveLength(1)
      expect(result[0].datasetId).toBe(datasetId)
    })

    it("respects limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await createDatapoint(db, {
          datasetId,
          dimensionKey: `key-${i}`,
          value: i,
        })
      }

      const all = await listDatapoints(db, datasetId)
      expect(all).toHaveLength(5)

      const limited = await listDatapoints(db, datasetId, {
        limit: 2,
        offset: 1,
      })
      expect(limited).toHaveLength(2)
    })
  })

  describe("countDatapoints", () => {
    it("returns 0 when no datapoints exist for a different dataset id", async () => {
      const total = await countDatapoints(db, "non-existent-dataset")
      expect(total).toBe(0)
    })

    it("counts datapoints for a specific dataset", async () => {
      await createDatapoint(db, { datasetId, value: 1 })
      await createDatapoint(db, { datasetId, value: 2 })

      // Create a dataset with no datapoints (this one had "ds-2" before,
      // but now we use a real second dataset instead)
      const ds2 = unwrap(await createDataset(db, { title: "Third Dataset" }))
      await createDatapoint(db, { datasetId: ds2.id, value: 3 })

      const total = await countDatapoints(db, datasetId)
      expect(total).toBe(2)
    })
  })

  describe("bulkCreateDatapoints", () => {
    it("creates multiple datapoints", async () => {
      const inputs: DatapointInput[] = [
        { datasetId, value: 10 },
        { datasetId, value: 20 },
        { datasetId, value: 30 },
      ]

      const results = unwrap(await bulkCreateDatapoints(db, inputs))
      expect(results).toHaveLength(3)
      expect(results[0].datasetId).toBe(datasetId)
      expect(results[1].value).toBe(20)

      const total = await countDatapoints(db, datasetId)
      expect(total).toBe(3)
    })
  })
})
