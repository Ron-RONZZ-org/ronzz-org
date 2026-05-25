import { describe, it, expect } from "vitest"
import { barChart, defaultDimensions } from "@ronzz/ronstats-core/charts"
import type { Datapoint } from "@ronzz/ronstats-core"

describe("barChart", () => {
  const dim = defaultDimensions(600)

  it("returns empty bars for empty datapoints", () => {
    const result = barChart([], dim)
    expect(result.bars).toEqual([])
    expect(result.xTicks).toEqual([])
    expect(result.yTicks.length).toBeGreaterThan(0)
    expect(result.unit).toBe("")
  })

  it("renders a single bar", () => {
    const dps: Datapoint[] = [
      { id: "1", datasetId: "d1", dimensionKey: "cat", dimensionValue: "A", value: 10, unit: "kg", year: "2024", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = barChart(dps, dim)
    expect(result.bars).toHaveLength(1)
    expect(result.bars[0].key).toBe("2024")
    expect(result.bars[0].value).toBe(10)
    expect(result.bars[0].width).toBeGreaterThan(0)
    expect(result.unit).toBe("kg")
  })

  it("renders multiple bars in sorted order", () => {
    const dps: Datapoint[] = [
      { id: "1", datasetId: "d1", dimensionKey: "cat", dimensionValue: "B", value: 20, unit: "", year: "", metadata: {}, createdAt: "2024-01-01" },
      { id: "2", datasetId: "d1", dimensionKey: "cat", dimensionValue: "A", value: 10, unit: "", year: "", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = barChart(dps, dim)
    expect(result.bars).toHaveLength(2)
    // Sorted by label: A, B
    expect(result.bars[0].key).toBe("A")
    expect(result.bars[1].key).toBe("B")
  })

  it("uses d3.ticks for round tick labels", () => {
    const dps: Datapoint[] = [
      { id: "1", datasetId: "d1", dimensionKey: "cat", dimensionValue: "A", value: 100, unit: "", year: "", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = barChart(dps, dim)
    // d3.ticks returns ~5+1 round human-readable values
    expect(result.yTicks.length).toBeGreaterThanOrEqual(5)
    const topLabel = Number(result.yTicks[result.yTicks.length - 1].label)
    expect(topLabel).toBeGreaterThan(0)
    expect(topLabel).toBeLessThanOrEqual(110)
  })

  it("handles all-zero values", () => {
    const dps: Datapoint[] = [
      { id: "1", datasetId: "d1", dimensionKey: "cat", dimensionValue: "A", value: 0, unit: "", year: "", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = barChart(dps, dim)
    expect(result.bars).toHaveLength(1)
    // With value=0, yMax = max(0,1)*1.1 = 1.1, so bar height is 0
    expect(result.bars[0].height).toBe(0)
  })
})
