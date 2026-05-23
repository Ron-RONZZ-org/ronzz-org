import { z } from "zod"

export const datasetSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).default(""),
  source: z.string().max(500).default(""),
  sourceUrl: z.string().max(1000).default(""),
  license: z.string().max(200).default(""),
  locale: z.enum(["fr", "eo", "en"]).default("fr"),
  metadata: z.record(z.unknown()).default({}),
})

export const datapointSchema = z.object({
  datasetId: z.string().uuid(),
  dimensionKey: z.string().max(200).default(""),
  dimensionValue: z.string().max(200).default(""),
  value: z.number(),
  unit: z.string().max(50).default(""),
  year: z.string().max(10).default(""),
  metadata: z.record(z.unknown()).default({}),
})
