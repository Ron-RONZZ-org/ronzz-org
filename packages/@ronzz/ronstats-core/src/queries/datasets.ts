import { eq, like, or, and, isNull, isNotNull, desc, sql } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { Database } from "database/db-types"
import { queryAll, queryGet, queryRun } from "database/dialect-query"
import { tryResult, toLocale, escapeLike, type Result, type AppError } from "@ronzz/shared-core"
import type { Dataset, DatasetInput } from "../types"

/** Narrow the dual-dialect DB union to a minimal compatible type for Drizzle chain calls. */
// biome-ignore lint/suspicious/noExplicitAny: Drizzle union type incompatibility between PG and SQLite builders
const d = (db: Database): any => db

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_TRASH_PAGE_SIZE = 50

interface ListOptions {
  search?: string
  locale?: string
  limit?: number
  offset?: number
  includeTrash?: boolean
}

export async function listDatasets(
  db: Database,
  options: ListOptions = {},
): Promise<{ datasets: Dataset[]; total: number }> {
  const conditions: any[] = []

  if (!options.includeTrash) {
    conditions.push(isNull(schema.datasets.deletedAt))
  }

  if (options.search) {
    const term = `%${escapeLike(options.search)}%`
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
  const limit = options.limit ?? DEFAULT_PAGE_SIZE
  const offset = options.offset ?? 0

  const rows = await queryAll<Dataset>(
    d(db)
      .select()
      .from(schema.datasets)
      .where(where)
      .limit(limit)
      .offset(offset),
  )

  const countResult = await queryGet<{ count: number }>(
    d(db)
      .select({ count: sql<number>`count(*)` })
      .from(schema.datasets)
      .where(where),
  )
  const total = countResult?.count ?? 0

  return { datasets: rows as Dataset[], total }
}

export async function getDataset(
  db: Database,
  id: string,
): Promise<Dataset | undefined> {
  const row = await queryGet<Dataset>(
    d(db)
      .select()
      .from(schema.datasets)
      .where(
        and(eq(schema.datasets.id, id), isNull(schema.datasets.deletedAt)),
      ),
  )
  return row as Dataset | undefined
}

export async function createDataset(
  db: Database,
  input: DatasetInput,
): Promise<Result<Dataset, AppError>> {
  return tryResult(async () => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await queryRun(
      d(db)
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
        }),
    )
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
    } as Dataset
  })
}

/** Soft-delete a dataset by setting deleted_at. */
export async function softDeleteDataset(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await queryRun(
      d(db)
        .update(schema.datasets)
        .set({ deletedAt: new Date().toISOString() })
        .where(
          and(eq(schema.datasets.id, id), isNull(schema.datasets.deletedAt)),
        ),
    )
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

interface TrashListOptions {
  limit?: number
  offset?: number
}

/** List soft-deleted (trashed) datasets. */
export async function listTrashDatasets(
  db: Database,
  options?: TrashListOptions,
): Promise<{ datasets: Dataset[]; total: number }> {
  const limit = options?.limit ?? DEFAULT_TRASH_PAGE_SIZE
  const offset = options?.offset ?? 0

  const rows = await queryAll<Dataset>(
    d(db)
      .select()
      .from(schema.datasets)
      .where(isNotNull(schema.datasets.deletedAt))
      .orderBy(desc(schema.datasets.deletedAt), desc(schema.datasets.id))
      .limit(limit)
      .offset(offset),
  )

  const countResult = await queryGet<{ count: number }>(
    d(db)
      .select({ count: sql<number>`count(*)` })
      .from(schema.datasets)
      .where(isNotNull(schema.datasets.deletedAt)),
  )
  const total = countResult?.count ?? 0

  return { datasets: rows as Dataset[], total }
}

/** Restore a soft-deleted dataset. */
export async function restoreDataset(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await queryRun(
      d(db)
        .update(schema.datasets)
        .set({ deletedAt: null })
        .where(
          and(eq(schema.datasets.id, id), isNotNull(schema.datasets.deletedAt)),
        ),
    )
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

/** Permanently delete a dataset and all its datapoints. */
export async function hardDeleteDataset(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    // Delete datapoints first to avoid FK violation on PG
    await queryRun(
      d(db)
        .delete(schema.datapoints)
        .where(eq(schema.datapoints.datasetId, id)),
    )
    const result = await queryRun(
      d(db)
        .delete(schema.datasets)
        .where(eq(schema.datasets.id, id)),
    )
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

/** Legacy alias for soft-delete. */
export const deleteDataset = softDeleteDataset
