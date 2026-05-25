import { scaleLinear, scalePoint, line as d3Line } from "d3"
import type { Datapoint } from "../../types"
import type { LineChartResult, ChartDimensions } from "../types"
import { getInner } from "../types"
import { formatNumber } from "./format-number"

export function lineChart(
  datapoints: Datapoint[],
  dim: ChartDimensions,
): LineChartResult {
  const inner = getInner(dim)

  const labelKey = (dp: Datapoint): string =>
    dp.year || dp.dimensionValue || dp.dimensionKey

  const data = [...datapoints]
    .sort((a, b) => labelKey(a).localeCompare(labelKey(b)))
    .map((dp) => ({ key: labelKey(dp), value: dp.value }))

  const xScale = scalePoint()
    .domain(data.map((d) => d.key))
    .range([0, inner.width])

  const yMin = 0
  const yMax = data.reduce((max, d) => Math.max(max, d.value), 1) * 1.1
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([inner.height, 0])

  const line = d3Line<{ key: string; value: number }>()
    .x((d) => xScale(d.key)!)
    .y((d) => yScale(d.value))

  const path = line(data) || ""

  const xTicks = data.map((d) => ({
    value: xScale(d.key)!,
    label: d.key,
  }))

  const yTicksCount = 5
  const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
    const v = yMin + (yMax / (yTicksCount - 1)) * i
    return { value: yScale(v), label: formatNumber(v) }
  })

  return {
    path,
    xScale: { domain: [0, data.length - 1], range: [0, inner.width] },
    yScale: { domain: [yMin, yMax], range: [inner.height, 0] },
    xTicks,
    yTicks,
    unit: datapoints[0]?.unit ?? "",
  }
}


