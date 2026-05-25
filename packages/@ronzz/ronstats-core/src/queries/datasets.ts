import { eq, like, or, and, isNull, isNotNull, desc, sql } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { Database } from "database/db-types"
import { tryResult, toLocale, type Result, type AppError } from "@ronzz/shared-core"
import type { Dataset, DatasetInput } from "../types"

interface ListOptions {
  search?: string
  locale?: string
  limit?: number
  offset?: number
  includeTrash?: boolean
}

export async function listDatasets(
  db: any,
  options: ListOptions = {},
): Promise<{ datasets: Dataset[]; total: number }> {
  const conditions: any[] = []

  if (!options.includeTrash) {
    conditions.push(isNull(schema.datasets.deletedAt))
  }

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
  db: Database,
  input: DatasetInput,
): Promise<Result<Dataset, AppError>> {
  return tryResult(async () => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const [dataset] = await (db as any)
      .insert(schema.datasets)
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
      .returning()
      .all()
    return {
      ...dataset,
      deletedAt: dataset.deletedAt ?? null,
    } as Dataset
  })
}

/** Soft-delete a dataset by setting deleted_at. */
export async function softDeleteDataset(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await (db as any)
      .update(schema.datasets)
      .set({ deletedAt: new Date().toISOString() })
      .where(
        and(eq(schema.datasets.id, id), isNull(schema.datasets.deletedAt)),
      )
      .run()
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

interface TrashListOptions {
  limit?: number
  offset?: number
}

/** List soft-deleted (trashed) datasets. */
export async function listTrashDatasets(
  db: any,
  options?: TrashListOptions,
): Promise<{ datasets: Dataset[]; total: number }> {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  const rows = await db
    .select()
    .from(schema.datasets)
    .where(isNotNull(schema.datasets.deletedAt))
    .orderBy(desc(schema.datasets.deletedAt))
    .limit(limit)
    .offset(offset)
    .all()

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.datasets)
    .where(isNotNull(schema.datasets.deletedAt))
    .get()
  const total = countResult?.count ?? 0

  return { datasets: rows as Dataset[], total }
}

/** Restore a soft-deleted dataset. */
export async function restoreDataset(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await (db as any)
      .update(schema.datasets)
      .set({ deletedAt: null })
      .where(eq(schema.datasets.id, id))
      .run()
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

/** Permanently delete a dataset. */
export async function hardDeleteDataset(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await (db as any)
      .delete(schema.datasets)
      .where(eq(schema.datasets.id, id))
      .run()
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

/** Legacy alias for soft-delete. */
export const deleteDataset = softDeleteDataset
