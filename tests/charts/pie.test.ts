import type { Datapoint } from "@ronzz/ronstats-core"
import { defaultDimensions, pieChart } from "@ronzz/ronstats-core/charts"
import { describe, expect, it } from "vitest"

describe("pieChart", () => {
  const dim = defaultDimensions(600)

  it("returns fallback arc for empty datapoints", () => {
    const result = pieChart([], dim)
    expect(result.arcs).toEqual([])
    // total defaults to 1 to avoid division by zero
    expect(result.total).toBe(1)
    expect(result.unit).toBe("")
  })

  it("renders a single arc filling 360 degrees", () => {
    const dps: Datapoint[] = [
      {
        id: "1",
        datasetId: "d1",
        dimensionKey: "cat",
        dimensionValue: "A",
        value: 100,
        unit: "units",
        year: "",
        metadata: {},
        createdAt: "2024-01-01",
      },
    ]
    const result = pieChart(dps, dim)
    expect(result.arcs).toHaveLength(1)
    // key is a composite of dimensionKey and dimensionValue
    expect(result.arcs[0].key).toBe("cat:::A")
    expect(result.arcs[0].value).toBe(100)
    // Full circle: startAngle=0, endAngle=2*PI
    expect(result.arcs[0].startAngle).toBe(0)
    expect(result.arcs[0].endAngle).toBeCloseTo(Math.PI * 2, 5)
    expect(result.total).toBe(100)
    expect(result.unit).toBe("units")
  })

  it("splits arcs proportionally", () => {
    const dps: Datapoint[] = [
      {
        id: "1",
        datasetId: "d1",
        dimensionKey: "cat",
        dimensionValue: "A",
        value: 1,
        unit: "",
        year: "",
        metadata: {},
        createdAt: "2024-01-01",
      },
      {
        id: "2",
        datasetId: "d1",
        dimensionKey: "cat",
        dimensionValue: "B",
        value: 3,
        unit: "",
        year: "",
        metadata: {},
        createdAt: "2024-01-01",
      },
    ]
    const result = pieChart(dps, dim)
    expect(result.arcs).toHaveLength(2)
    expect(result.total).toBe(4)
    // A should be 1/4 of circle (PI/2), B should be 3/4 (3*PI/2)
    expect(result.arcs[0].endAngle - result.arcs[0].startAngle).toBeCloseTo(Math.PI / 2, 5)
    expect(result.arcs[1].endAngle - result.arcs[1].startAngle).toBeCloseTo((3 * Math.PI) / 2, 5)
  })

  it("groups duplicate dimension values", () => {
    const dps: Datapoint[] = [
      {
        id: "1",
        datasetId: "d1",
        dimensionKey: "cat",
        dimensionValue: "A",
        value: 10,
        unit: "",
        year: "",
        metadata: {},
        createdAt: "2024-01-01",
      },
      {
        id: "2",
        datasetId: "d1",
        dimensionKey: "cat",
        dimensionValue: "A",
        value: 20,
        unit: "",
        year: "",
        metadata: {},
        createdAt: "2024-01-01",
      },
    ]
    const result = pieChart(dps, dim)
    expect(result.arcs).toHaveLength(1)
    expect(result.arcs[0].value).toBe(30)
    expect(result.total).toBe(30)
  })

  it("separates different dimensionKeys with same dimensionValue", () => {
    // Two datapoints with same dimensionValue but different dimensionKey
    // should NOT be grouped together (composite key fix)
    const dps: Datapoint[] = [
      {
        id: "1",
        datasetId: "d1",
        dimensionKey: "region",
        dimensionValue: "A",
        value: 10,
        unit: "",
        year: "",
        metadata: {},
        createdAt: "2024-01-01",
      },
      {
        id: "2",
        datasetId: "d1",
        dimensionKey: "category",
        dimensionValue: "A",
        value: 20,
        unit: "",
        year: "",
        metadata: {},
        createdAt: "2024-01-01",
      },
    ]
    const result = pieChart(dps, dim)
    expect(result.arcs).toHaveLength(2)
    expect(result.arcs[0].key).toBe("region:::A")
    expect(result.arcs[1].key).toBe("category:::A")
  })
})
