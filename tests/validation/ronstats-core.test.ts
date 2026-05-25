import { describe, it, expect } from "vitest"
import { datasetSchema, datapointSchema } from "@ronzz/ronstats-core"

describe("datasetSchema", () => {
  it("accepts valid dataset input", () => {
    const result = datasetSchema.safeParse({
      title: "Test Dataset",
      description: "A description",
      source: "Source",
      sourceUrl: "https://example.com",
      license: "MIT",
      locale: "fr",
      chartType: "bar",
      metadata: { key: "value" },
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = datasetSchema.safeParse({ title: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid locale", () => {
    const result = datasetSchema.safeParse({ title: "X", locale: "de" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid chartType", () => {
    const result = datasetSchema.safeParse({ title: "X", chartType: "scatter" })
    expect(result.success).toBe(false)
  })

  it("applies defaults for optional fields", () => {
    const result = datasetSchema.safeParse({ title: "Minimal" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe("")
      expect(result.data.locale).toBe("fr")
      expect(result.data.chartType).toBe("bar")
      expect(result.data.metadata).toEqual({})
    }
  })

  it("rejects title longer than 500 chars", () => {
    const result = datasetSchema.safeParse({ title: "X".repeat(501) })
    expect(result.success).toBe(false)
  })
})

describe("datapointSchema", () => {
  it("accepts valid datapoint input", () => {
    const result = datapointSchema.safeParse({
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      value: 42,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid datasetId", () => {
    const result = datapointSchema.safeParse({
      datasetId: "not-a-uuid",
      value: 42,
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-numeric value", () => {
    const result = datapointSchema.safeParse({
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      value: "not-a-number",
    })
    expect(result.success).toBe(false)
  })

  it("applies defaults for optional fields", () => {
    const result = datapointSchema.safeParse({
      datasetId: "550e8400-e29b-41d4-a716-446655440000",
      value: 10,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dimensionKey).toBe("")
      expect(result.data.dimensionValue).toBe("")
      expect(result.data.unit).toBe("")
      expect(result.data.year).toBe("")
      expect(result.data.metadata).toEqual({})
    }
  })
})
