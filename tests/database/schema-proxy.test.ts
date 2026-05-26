import { detectDialect, getSchema, resetDialectCache, schema } from "database/schema/proxy"
import { beforeEach, describe, expect, it } from "vitest"

describe("schema proxy", () => {
  beforeEach(() => {
    resetDialectCache()
  })

  describe("detectDialect", () => {
    it("returns sqlite for :memory: URL", () => {
      process.env.DATABASE_URL = ":memory:"
      resetDialectCache()
      expect(detectDialect()).toBe("sqlite")
    })

    it("returns sqlite for file-based URL", () => {
      process.env.DATABASE_URL = "./test.db"
      resetDialectCache()
      expect(detectDialect()).toBe("sqlite")
    })

    it("returns pg for postgres URL", () => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db"
      resetDialectCache()
      expect(detectDialect()).toBe("pg")
    })

    it("returns pg for postgresql URL", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db"
      resetDialectCache()
      expect(detectDialect()).toBe("pg")
    })
  })

  describe("getSchema", () => {
    it("returns sqlite schema when DATABASE_URL is sqlite", () => {
      process.env.DATABASE_URL = ":memory:"
      resetDialectCache()
      const result = getSchema()
      // Check that it has sqlite-specific table references
      expect(result.datasets).toBeDefined()
      expect(result.resources).toBeDefined()
      expect(result.users).toBeDefined()
      expect(result.sessions).toBeDefined()
    })

    it("returns pg schema when DATABASE_URL is postgres", () => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db"
      resetDialectCache()
      const result = getSchema()
      expect(result.datasets).toBeDefined()
      expect(result.resources).toBeDefined()
      expect(result.users).toBeDefined()
      expect(result.sessions).toBeDefined()
    })

    it("re-evaluates after resetDialectCache", () => {
      process.env.DATABASE_URL = ":memory:"
      resetDialectCache()
      const first = getSchema()

      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db"
      resetDialectCache()
      const second = getSchema()

      // Schema objects should be different (sqlite vs pg)
      expect(first).not.toBe(second)
    })
  })

  describe("schema Proxy", () => {
    it("forwards property access to the current schema", () => {
      process.env.DATABASE_URL = ":memory:"
      resetDialectCache()
      expect(schema.datasets).toBeDefined()
      expect(schema.resources).toBeDefined()
      expect(schema.users).toBeDefined()
    })

    it("returns different table objects after dialect change and reset", () => {
      process.env.DATABASE_URL = ":memory:"
      resetDialectCache()
      const firstDatasets = schema.datasets

      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db"
      resetDialectCache()
      const secondDatasets = schema.datasets

      // After reset, should resolve to pg schema which is a different object
      expect(firstDatasets).not.toBe(secondDatasets)
    })
  })
})
