import type { Locale } from "@ronzz/shared-core"

export type ChartType = "line" | "bar" | "pie"

export interface Dataset {
  id: string
  title: string
  description: string
  source: string
  sourceUrl: string
  license: string
  locale: Locale
  chartType: ChartType
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface DatasetInput {
  title: string
  description?: string
  source?: string
  sourceUrl?: string
  license?: string
  locale?: Locale
  chartType?: ChartType
  metadata?: Record<string, unknown>
}

export interface Datapoint {
  id: string
  datasetId: string
  dimensionKey: string
  dimensionValue: string
  value: number
  unit: string
  year: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface DatapointInput {
  datasetId: string
  dimensionKey?: string
  dimensionValue?: string
  value: number
  unit?: string
  year?: string
  metadata?: Record<string, unknown>
}
