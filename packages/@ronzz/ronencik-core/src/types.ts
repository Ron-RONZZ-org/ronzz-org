import type { Locale } from "@ronzz/shared-core"

export interface ArticleMetadata {
  id: string
  slug: string
  title: string
  description: string
  locale: Locale
  metadata: Record<string, unknown>
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ArticleMetadataInput {
  slug: string
  title: string
  description?: string
  locale?: Locale
  metadata?: Record<string, unknown>
  publishedAt?: string | null
}
