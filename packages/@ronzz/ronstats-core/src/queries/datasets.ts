import { eq, like, or, and, isNull, isNotNull, sql } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { Dataset, DatasetInput } from "../types"

interface ListOptions {
  search?: string
  locale?: string
  limit?: number
  offset?: number
  includeTrash?: boolean
}

function toLocale(locale?: string): "fr" | "eo" | "en" | undefined {
  if (locale === "fr" || locale === "eo" || locale === "en") return locale
  return undefined
}

export async function listDatasets(
  db: any,
  options: ListOptions = {},
): Promise<{ datasets: Dataset[]; total: number }> {
  const conditions = [isNull(schema.datasets.deletedAt)]

  if (options.search) {
    const term = `%${options.search}%`
    conditions.push(
      or(
        like(schema.datasets.title, term),
        like(schema.datasets.description, term),
      )!,
    )
  }
  const locale = toLocale(options.locale)
  if (locale) {
    conditions.push(eq(schema.datasets.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const rows = await db
    .select()
    .from(schema.datasets)
    .where(where)
    .limit(limit)
    .offset(offset)
    .all()

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.datasets)
    .where(where)
    .get()
  const total = countResult?.count ?? 0

  return { datasets: rows as Dataset[], total }
}

export async function getDataset(
  db: any,
  id: string,
): Promise<Dataset | undefined> {
  const row = await db
    .select()
    .from(schema.datasets)
    .where(
      and(eq(schema.datasets.id, id), isNull(schema.datasets.deletedAt)),
    )
    .get()
  return row as Dataset | undefined
}

export async function createDataset(
  db: any,
  input: DatasetInput,
): Promise<Dataset> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.insert(schema.datasets)
    .values({
      id,
      title: input.title,
      description: input.description ?? "",
      source: input.source ?? "",
      sourceUrl: input.sourceUrl ?? "",
      license: input.license ?? "",
      locale: input.locale ?? "fr",
      chartType: input.chartType ?? "bar",
      metadata: (input.metadata ?? {}) as never,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  return {
    id,
    title: input.title,
    description: input.description ?? "",
    source: input.source ?? "",
    sourceUrl: input.sourceUrl ?? "",
    license: input.license ?? "",
    locale: input.locale ?? "fr",
    chartType: input.chartType ?? "bar",
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

/** Soft-delete a dataset by setting deleted_at. */
export async function softDeleteDataset(
  db: any,
  id: string,
): Promise<boolean> {
  const result = await db
    .update(schema.datasets)
    .set({ deletedAt: new Date().toISOString() })
    .where(
      and(eq(schema.datasets.id, id), isNull(schema.datasets.deletedAt)),
    )
    .run()
  return result.changes > 0
}

/** List soft-deleted (trashed) datasets. */
export async function listTrashDatasets(
  db: any,
): Promise<Dataset[]> {
  const rows = await db
    .select()
    .from(schema.datasets)
    .where(isNotNull(schema.datasets.deletedAt))
    .all()
  return rows as Dataset[]
}

/** Restore a soft-deleted dataset. */
export async function restoreDataset(
  db: any,
  id: string,
): Promise<boolean> {
  const result = await db
    .update(schema.datasets)
    .set({ deletedAt: null })
    .where(eq(schema.datasets.id, id))
    .run()
  return result.changes > 0
}

/** Permanently delete a dataset. */
export async function hardDeleteDataset(
  db: any,
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(schema.datasets)
    .where(eq(schema.datasets.id, id))
    .run()
  return result.changes > 0
}

/** Legacy alias for soft-delete. */
export const deleteDataset = softDeleteDataset
