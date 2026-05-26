import { type AppError, type Result, escapeLike, toLocale, tryResult } from "@ronzz/shared-core"
import type { Database } from "database/db-types"
import { dbNow, queryAll, queryGet, queryRun } from "database/dialect-query"
import { schema } from "database/schema/proxy"
import { and, asc, desc, eq, isNotNull, isNull, like, or, sql } from "drizzle-orm"
import type { Resource, ResourceInput } from "../types"

/** Narrow the dual-dialect DB union to a minimal compatible type for Drizzle chain calls. */
// biome-ignore lint/suspicious/noExplicitAny: Drizzle union type incompatibility between PG and SQLite builders
const d = (db: Database): any => db

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_TRASH_PAGE_SIZE = 50

interface ListOptions {
  typeId?: string
  search?: string
  locale?: string
  limit?: number
  offset?: number
  orderBy?: "createdAt" | "title"
  orderDir?: "asc" | "desc"
}

export async function listResources(
  db: Database,
  options: ListOptions = {},
): Promise<{ resources: Resource[]; total: number }> {
  const conditions = [isNull(schema.resources.deletedAt)]

  if (options.typeId) {
    conditions.push(eq(schema.resources.typeId, options.typeId))
  }
  if (options.search) {
    const term = `%${escapeLike(options.search)}%`
    conditions.push(
      // biome-ignore lint/style/noNonNullAssertion: or() returns undefined only for empty arrays
      or(like(schema.resources.title, term), like(schema.resources.description, term))!,
    )
  }
  const locale = toLocale(options.locale)
  if (locale) {
    conditions.push(eq(schema.resources.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = options.limit ?? DEFAULT_PAGE_SIZE
  const offset = options.offset ?? 0

  const orderColumn =
    options.orderBy === "title" ? schema.resources.title : schema.resources.createdAt
  const orderDir = options.orderDir === "asc" ? asc : desc

  const rows = await queryAll<Resource>(
    d(db)
      .select()
      .from(schema.resources)
      .where(where)
      .orderBy(orderDir(orderColumn))
      .limit(limit)
      .offset(offset),
  )

  const countResult = await queryGet<{ count: number }>(
    d(db).select({ count: sql<number>`count(*)` }).from(schema.resources).where(where),
  )
  const total = countResult?.count ?? 0

  return { resources: rows as Resource[], total }
}

export async function getResource(db: Database, id: string): Promise<Resource | undefined> {
  const row = await queryGet<Resource>(
    d(db)
      .select()
      .from(schema.resources)
      .where(and(eq(schema.resources.id, id), isNull(schema.resources.deletedAt))),
  )
  return row as Resource | undefined
}

export async function createResource(
  db: Database,
  input: ResourceInput,
): Promise<Result<Resource, AppError>> {
  return tryResult(async () => {
    const id = crypto.randomUUID()
    const now = dbNow()
    await queryRun(
      d(db)
        .insert(schema.resources)
        .values({
          id,
          typeId: input.typeId,
          title: input.title,
          description: input.description ?? "",
          url: input.url,
          locale: input.locale ?? "fr",
          metadata: (input.metadata ?? {}) as never,
          createdAt: now,
          updatedAt: now,
        }),
    )
    return {
      id,
      typeId: input.typeId,
      title: input.title,
      description: input.description ?? "",
      url: input.url,
      locale: input.locale ?? "fr",
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as Resource
  })
}

/** Soft-delete a resource by setting deletedAt. */
export async function deleteResource(db: Database, id: string): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await queryRun(
      d(db)
        .update(schema.resources)
        .set({ deletedAt: dbNow() })
        .where(and(eq(schema.resources.id, id), isNull(schema.resources.deletedAt))),
    )
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

interface TrashListOptions {
  limit?: number
  offset?: number
}

/** List soft-deleted (trashed) resources. */
export async function listTrashResources(
  db: Database,
  options?: TrashListOptions,
): Promise<{ resources: Resource[]; total: number }> {
  const limit = options?.limit ?? DEFAULT_TRASH_PAGE_SIZE
  const offset = options?.offset ?? 0

  const rows = await queryAll<Resource>(
    d(db)
      .select()
      .from(schema.resources)
      .where(isNotNull(schema.resources.deletedAt))
      .orderBy(desc(schema.resources.deletedAt), desc(schema.resources.id))
      .limit(limit)
      .offset(offset),
  )

  const countResult = await queryGet<{ count: number }>(
    d(db)
      .select({ count: sql<number>`count(*)` })
      .from(schema.resources)
      .where(isNotNull(schema.resources.deletedAt)),
  )
  const total = countResult?.count ?? 0

  return { resources: rows as Resource[], total }
}

/** Restore a soft-deleted resource. */
export async function restoreResource(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await queryRun(
      d(db)
        .update(schema.resources)
        .set({ deletedAt: null })
        .where(and(eq(schema.resources.id, id), isNotNull(schema.resources.deletedAt))),
    )
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}

/** Permanently delete a resource. */
export async function hardDeleteResource(
  db: Database,
  id: string,
): Promise<Result<boolean, AppError>> {
  return tryResult(async () => {
    const result = await queryRun(d(db).delete(schema.resources).where(eq(schema.resources.id, id)))
    return (result.changes ?? result.rowCount ?? 0) > 0
  })
}
