import type { Datapoint } from "../types"

export interface ChartDimensions {
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
}

export interface LineChartResult {
  path: string
  xScale: { domain: [number, number]; range: [number, number] }
  yScale: { domain: [number, number]; range: [number, number] }
  xTicks: { value: number; label: string }[]
  yTicks: { value: number; label: string }[]
  unit: string
}

export interface BarChartResult {
  bars: { key: string; value: number; x: number; y: number; width: number; height: number }[]
  xTicks: { value: number; label: string }[]
  yTicks: { value: number; label: string }[]
  unit: string
}

export interface PieChartResult {
  arcs: { key: string; value: number; startAngle: number; endAngle: number; padAngle: number }[]
  total: number
  unit: string
}

export function defaultDimensions(width = 600): ChartDimensions {
  return {
    width,
    height: 400,
    margin: { top: 20, right: 20, bottom: 40, left: 60 },
  }
}

export function getInner(dim: ChartDimensions): { width: number; height: number } {
  return {
    width: dim.width - dim.margin.left - dim.margin.right,
    height: dim.height - dim.margin.top - dim.margin.bottom,
  }
}
