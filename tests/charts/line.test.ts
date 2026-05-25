import { describe, it, expect } from "vitest"
import { lineChart, defaultDimensions } from "@ronzz/ronstats-core/charts"
import type { Datapoint } from "@ronzz/ronstats-core"

describe("lineChart", () => {
  const dim = defaultDimensions(600)

  it("returns empty path for empty datapoints", () => {
    const result = lineChart([], dim)
    expect(result.path).toBe("")
    expect(result.xTicks).toEqual([])
    expect(result.yTicks.length).toBeGreaterThan(0)
    expect(result.unit).toBe("")
  })

  it("renders a two-point line", () => {
    const dps: Datapoint[] = [
      { id: "1", datasetId: "d1", dimensionKey: "year", dimensionValue: "2023", value: 10, unit: "%", year: "2023", metadata: {}, createdAt: "2024-01-01" },
      { id: "2", datasetId: "d1", dimensionKey: "year", dimensionValue: "2024", value: 20, unit: "%", year: "2024", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = lineChart(dps, dim)
    // Should have an SVG path (non-empty)
    expect(result.path).toBeTruthy()
    expect(result.path.length).toBeGreaterThan(0)
    expect(result.xTicks).toHaveLength(2)
    expect(result.yTicks.length).toBeGreaterThan(0)
    expect(result.unit).toBe("%")
  })

  it("sorts points by key", () => {
    const dps: Datapoint[] = [
      { id: "2", datasetId: "d1", dimensionKey: "year", dimensionValue: "2024", value: 20, unit: "", year: "2024", metadata: {}, createdAt: "2024-01-01" },
      { id: "1", datasetId: "d1", dimensionKey: "year", dimensionValue: "2023", value: 10, unit: "", year: "2023", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = lineChart(dps, dim)
    expect(result.xTicks[0].label).toBe("2023")
    expect(result.xTicks[1].label).toBe("2024")
  })

  it("uses d3.ticks for round tick labels", () => {
    const dps: Datapoint[] = [
      { id: "1", datasetId: "d1", dimensionKey: "year", dimensionValue: "2024", value: 50, unit: "", year: "2024", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = lineChart(dps, dim)
    // d3.ticks returns ~5+1 round human-readable values
    expect(result.yTicks.length).toBeGreaterThanOrEqual(5)
    const topLabel = Number(result.yTicks[result.yTicks.length - 1].label)
    expect(topLabel).toBeGreaterThan(0)
    expect(topLabel).toBeLessThanOrEqual(55)
    // Labels should be round numbers (not 27.5, 55.0 etc.)
    expect(typeof result.yTicks[1]?.label === "string").toBe(true)
  })
})
