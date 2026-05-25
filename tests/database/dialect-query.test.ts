import { describe, it, expect, beforeEach } from "vitest"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"
import { queryAll, queryGet, queryRun, dbNow } from "database/dialect-query"
import { resetDialectCache } from "database/schema/proxy"

/**
 * Minimal inline schema for testing dialect-agnostic helpers.
 * Uses Drizzle's sqliteTable for proper typed table references.
 */
const testItems = sqliteTable("test_dialect_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  value: integer("value").notNull().default(0),
})

function createTestDb() {
  const sqliteDb = new Database(":memory:")
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS "test_dialect_items" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "value" integer NOT NULL DEFAULT 0
    );
  `)
  return drizzle(sqliteDb, { schema: { testItems } })
}

describe("dialect-query helpers (SQLite)", () => {
  let db: ReturnType<typeof drizzle>

  beforeEach(() => {
    db = createTestDb()
  })

  describe("queryRun", () => {
    it("inserts a row and returns result with changes", async () => {
      const result = await queryRun(
        db.insert(testItems).values({
          id: "x",
          name: "xray",
          value: 99,
        }),
      )
      expect(result.changes).toBeGreaterThanOrEqual(1)
    })

    it("deletes a row", async () => {
      await queryRun(
        db.insert(testItems).values({
          id: "del",
          name: "delete-me",
          value: 0,
        }),
      )

      const result = await queryRun(
        db.delete(testItems).where(sql`id = 'del'`),
      )
      expect(result.changes).toBeGreaterThanOrEqual(1)

      const rows = await queryAll(db.select().from(testItems))
      expect(rows).toHaveLength(0)
    })
  })

  describe("queryAll", () => {
    it("returns all rows as array", async () => {
      await queryRun(
        db.insert(testItems).values({ id: "a", name: "alpha", value: 1 }),
      )
      await queryRun(
        db.insert(testItems).values({ id: "b", name: "beta", value: 2 }),
      )

      const rows = await queryAll<{ id: string; name: string; value: number }>(
        db.select().from(testItems),
      )
      expect(rows).toHaveLength(2)
    })

    it("returns empty array for no matches", async () => {
      const rows = await queryAll(
        db.select().from(testItems).where(sql`1=0`),
      )
      expect(rows).toEqual([])
    })
  })

  describe("queryGet", () => {
    it("returns first matching row", async () => {
      await queryRun(
        db.insert(testItems).values({ id: "a", name: "alpha", value: 1 }),
      )

      const row = await queryGet<{ id: string; name: string }>(
        db.select().from(testItems),
      )
      expect(row).toBeDefined()
      expect(row!.name).toBe("alpha")
    })

    it("returns undefined for no match", async () => {
      const row = await queryGet(
        db.select().from(testItems).where(sql`1=0`),
      )
      expect(row).toBeUndefined()
    })
  })
})

describe("dbNow", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = ":memory:"
    resetDialectCache()
  })

  describe("SQLite dialect", () => {
    it("returns a number", () => {
      const now = dbNow()
      expect(typeof now).toBe("number")
    })

    it("returns a value close to Date.now()", () => {
      const before = Date.now()
      const now = dbNow() as number
      const after = Date.now()
      expect(now).toBeGreaterThanOrEqual(before - 1)
      expect(now).toBeLessThanOrEqual(after + 1)
    })

    it("applies offsetMs", () => {
      const offset = 5000
      const now = dbNow(offset) as number
      const base = Date.now()
      expect(now).toBeGreaterThanOrEqual(base + offset - 10)
    })
  })

  describe("PostgreSQL dialect", () => {
    it("returns a Date object", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test"
      resetDialectCache()
      const now = dbNow()
      expect(now).toBeInstanceOf(Date)
    })

    it("returns a Date close to now", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test"
      resetDialectCache()
      const before = Date.now()
      const now = dbNow() as Date
      const after = Date.now()
      expect(now.getTime()).toBeGreaterThanOrEqual(before - 100)
      expect(now.getTime()).toBeLessThanOrEqual(after + 100)
    })

    it("applies offsetMs", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test"
      resetDialectCache()
      const offset = 5000
      const now = dbNow(offset) as Date
      const base = Date.now()
      expect(now.getTime()).toBeGreaterThanOrEqual(base + offset - 10)
    })
  })
})
