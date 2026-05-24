import { eq, like, or, and, desc, asc, isNull, isNotNull, sql } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { Resource, ResourceInput } from "../types"

interface ListOptions {
  typeId?: string
  search?: string
  locale?: string
  limit?: number
  offset?: number
  orderBy?: "createdAt" | "title"
  orderDir?: "asc" | "desc"
}

function toLocale(locale?: string): "fr" | "eo" | "en" | undefined {
  if (locale === "fr" || locale === "eo" || locale === "en") return locale
  return undefined
}

export async function listResources(
  db: any,
  options: ListOptions = {},
): Promise<{ resources: Resource[]; total: number }> {
  const conditions = [isNull(schema.resources.deletedAt)]

  if (options.typeId) {
    conditions.push(eq(schema.resources.typeId, options.typeId))
  }
  if (options.search) {
    const term = `%${options.search}%`
    conditions.push(
      or(
        like(schema.resources.title, term),
        like(schema.resources.description, term),
      )!,
    )
  }
  const locale = toLocale(options.locale)
  if (locale) {
    conditions.push(eq(schema.resources.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const orderColumn =
    options.orderBy === "title"
      ? schema.resources.title
      : schema.resources.createdAt
  const orderDir = options.orderDir === "asc" ? asc : desc

  const rows = await db
    .select()
    .from(schema.resources)
    .where(where)
    .orderBy(orderDir(orderColumn))
    .limit(limit)
    .offset(offset)
    .all()

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.resources)
    .where(where)
    .get()
  const total = countResult?.count ?? 0

  return { resources: rows as Resource[], total }
}

export async function getResource(
  db: any,
  id: string,
): Promise<Resource | undefined> {
  const row = await db
    .select()
    .from(schema.resources)
    .where(
      and(eq(schema.resources.id, id), isNull(schema.resources.deletedAt)),
    )
    .get()
  return row as Resource | undefined
}

export async function createResource(
  db: any,
  input: ResourceInput,
): Promise<Resource> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.insert(schema.resources)
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
    })
    .run()
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
  }
}

/** Soft-delete a resource by setting deletedAt. */
export async function deleteResource(
  db: any,
  id: string,
): Promise<boolean> {
  const result = await db
    .update(schema.resources)
    .set({ deletedAt: new Date().toISOString() })
    .where(
      and(eq(schema.resources.id, id), isNull(schema.resources.deletedAt)),
    )
    .run()
  return result.changes > 0
}

/** List soft-deleted (trashed) resources. */
export async function listTrashResources(
  db: any,
): Promise<Resource[]> {
  const rows = await db
    .select()
    .from(schema.resources)
    .where(isNotNull(schema.resources.deletedAt))
    .all()
  return rows as Resource[]
}

/** Restore a soft-deleted resource. */
export async function restoreResource(
  db: any,
  id: string,
): Promise<boolean> {
  const result = await db
    .update(schema.resources)
    .set({ deletedAt: null })
    .where(eq(schema.resources.id, id))
    .run()
  return result.changes > 0
}

/** Permanently delete a resource. */
export async function hardDeleteResource(
  db: any,
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(schema.resources)
    .where(eq(schema.resources.id, id))
    .run()
  return result.changes > 0
}
