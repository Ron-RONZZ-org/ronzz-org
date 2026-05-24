import type { Locale } from "@ronzz/shared-core"

export interface ResourceType {
  id: string
  slug: string
  nameFr: string
  nameEo: string
  nameEn: string
}

export interface Resource {
  id: string
  typeId: string
  title: string
  description: string
  url: string
  locale: Locale
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ResourceInput {
  typeId: string
  title: string
  description?: string
  url: string
  locale?: Locale
  metadata?: Record<string, unknown>
}

export interface ResourceTypeInput {
  slug: string
  nameFr: string
  nameEo: string
  nameEn: string
}
