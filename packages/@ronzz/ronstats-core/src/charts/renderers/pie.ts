import type { Datapoint } from "../../types"
import type { ChartDimensions, PieChartResult } from "../types"

export function pieChart(datapoints: Datapoint[], _dim: ChartDimensions): PieChartResult {
  const labelKey = (dp: Datapoint): string =>
    dp.dimensionValue || dp.dimensionKey || dp.year || dp.id

  const grouped = new Map<string, number>()
  for (const dp of datapoints) {
    const key = labelKey(dp)
    grouped.set(key, (grouped.get(key) ?? 0) + dp.value)
  }

  const rawTotal = [...grouped.values()].reduce((a, b) => a + b, 0)
  const total = rawTotal || 1

  let currentAngle = 0
  const arcs = [...grouped.entries()].map(([key, value]) => {
    const startAngle = currentAngle
    const angle = (value / total) * Math.PI * 2
    currentAngle += angle
    return {
      key,
      value,
      startAngle,
      endAngle: currentAngle,
      padAngle: 0.02,
    }
  })

  return { arcs, total, unit: datapoints[0]?.unit ?? "" }
}
