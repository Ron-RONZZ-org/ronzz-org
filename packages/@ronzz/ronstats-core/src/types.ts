import type { Locale } from "@ronzz/shared-core"

export interface Dataset {
  id: string
  title: string
  description: string
  source: string
  sourceUrl: string
  license: string
  locale: Locale
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface DatasetInput {
  title: string
  description?: string
  source?: string
  sourceUrl?: string
  license?: string
  locale?: Locale
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
