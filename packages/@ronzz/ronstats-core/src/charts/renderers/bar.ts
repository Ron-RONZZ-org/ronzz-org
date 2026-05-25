import { scaleLinear, scaleBand } from "d3"
import type { Datapoint } from "../../types"
import type { BarChartResult, ChartDimensions } from "../types"
import { getInner } from "../types"
import { formatNumber } from "./format-number"

export function barChart(
  datapoints: Datapoint[],
  dim: ChartDimensions,
): BarChartResult {
  const inner = getInner(dim)

  const labelKey = (dp: Datapoint): string =>
    dp.year || dp.dimensionValue || dp.dimensionKey

  const data = [...datapoints]
    .sort((a, b) => labelKey(a).localeCompare(labelKey(b)))
    .map((dp) => ({ key: labelKey(dp), value: dp.value }))

  const xScale = scaleBand()
    .domain(data.map((d) => d.key))
    .range([0, inner.width])
    .padding(0.2)

  const yMin = 0
  const yMax = data.reduce((max, d) => Math.max(max, d.value), 1) * 1.1
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([inner.height, 0])

  const bars = data.map((d) => ({
    key: d.key,
    value: d.value,
    x: xScale(d.key)!,
    y: yScale(d.value),
    width: xScale.bandwidth(),
    height: inner.height - yScale(d.value),
  }))

  const yTicksCount = 5
  const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
    const v = yMin + (yMax / (yTicksCount - 1)) * i
    return { value: yScale(v), label: formatNumber(v) }
  })

  return {
    bars,
    xTicks: data.map((d) => ({
      value: xScale(d.key)! + xScale.bandwidth() / 2,
      label: d.key,
    })),
    yTicks,
    unit: datapoints[0]?.unit ?? "",
  }
}


