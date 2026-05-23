import { z } from "zod"

export const resourceTypeSchema = z.object({
  slug: z.string().min(1).max(50),
  nameFr: z.string().min(1).max(100),
  nameEo: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
})

export const resourceSchema = z.object({
  typeId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).default(""),
  url: z.string().url().or(z.string().max(0)),
  locale: z.enum(["fr", "eo", "en"]).default("fr"),
  metadata: z.record(z.unknown()).default({}),
})
