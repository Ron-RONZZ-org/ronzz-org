import { describe, it, expect } from "vitest"
import { lineChart, defaultDimensions } from "@ronzz/ronstats-core/charts"
import type { Datapoint } from "@ronzz/ronstats-core"

describe("lineChart", () => {
  const dim = defaultDimensions(600)

  it("returns empty path for empty datapoints", () => {
    const result = lineChart([], dim)
    expect(result.path).toBe("")
    expect(result.xTicks).toEqual([])
    expect(result.yTicks).toHaveLength(5)
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
    expect(result.yTicks).toHaveLength(5)
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

  it("computes y-axis max as 1.1 * data max", () => {
    const dps: Datapoint[] = [
      { id: "1", datasetId: "d1", dimensionKey: "year", dimensionValue: "2024", value: 50, unit: "", year: "2024", metadata: {}, createdAt: "2024-01-01" },
    ]
    const result = lineChart(dps, dim)
    const yMaxTick = result.yTicks[result.yTicks.length - 1]
    expect(yMaxTick.label).toBe("55.0")
  })
})
