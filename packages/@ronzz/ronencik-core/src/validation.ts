import { z } from "zod"

export const articleMetadataSchema = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).default(""),
  locale: z.enum(["fr", "eo", "en"]).default("fr"),
  metadata: z.record(z.unknown()).default({}),
  publishedAt: z.string().nullable().optional(),
})
