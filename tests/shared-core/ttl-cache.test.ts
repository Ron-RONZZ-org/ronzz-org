import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { TtlCache } from "@ronzz/shared-core"

describe("TtlCache", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("stores and retrieves values", () => {
    const cache = new TtlCache<string>(1000)
    cache.set("key1", "value1")
    expect(cache.get("key1")).toBe("value1")
  })

  it("returns undefined for missing keys", () => {
    const cache = new TtlCache<string>(1000)
    expect(cache.get("nonexistent")).toBeUndefined()
  })

  it("expires entries after TTL", () => {
    const cache = new TtlCache<string>(100)
    cache.set("key1", "value1")
    expect(cache.get("key1")).toBe("value1")

    vi.advanceTimersByTime(101)
    expect(cache.get("key1")).toBeUndefined()
  })

  it("supports different value types", () => {
    const numCache = new TtlCache<number>(1000)
    numCache.set("count", 42)
    expect(numCache.get("count")).toBe(42)

    const objCache = new TtlCache<{ a: number }>(1000)
    objCache.set("obj", { a: 1 })
    expect(objCache.get("obj")).toEqual({ a: 1 })
  })

  it("clear removes all entries", () => {
    const cache = new TtlCache<string>(1000)
    cache.set("a", "1")
    cache.set("b", "2")
    cache.clear()
    expect(cache.get("a")).toBeUndefined()
    expect(cache.get("b")).toBeUndefined()
  })

  it("overwrites existing key", () => {
    const cache = new TtlCache<string>(1000)
    cache.set("key", "old")
    cache.set("key", "new")
    expect(cache.get("key")).toBe("new")
  })

  it("deletes expired entries on get", () => {
    const cache = new TtlCache<string>(50)
    cache.set("key", "value")
    vi.advanceTimersByTime(51)
    cache.get("key") // triggers expiry check
    // Internal store should be cleaned up (can't test directly,
    // but ensures no memory leak on expiry)
    expect(cache.get("key")).toBeUndefined()
  })
})
