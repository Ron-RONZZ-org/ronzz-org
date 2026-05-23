import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq, like, or, and, desc, asc } from "drizzle-orm"
import * as sqliteSchema from "database/schema/sqlite/index"
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

export function listResources(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  options: ListOptions = {},
): { resources: Resource[]; total: number } {
  const conditions = []

  if (options.typeId) {
    conditions.push(eq(sqliteSchema.resources.typeId, options.typeId))
  }
  if (options.search) {
    const term = `%${options.search}%`
    conditions.push(
      or(
        like(sqliteSchema.resources.title, term),
        like(sqliteSchema.resources.description, term),
      ),
    )
  }
  const locale = toLocale(options.locale)
  if (locale) {
    conditions.push(eq(sqliteSchema.resources.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const orderColumn =
    options.orderBy === "title"
      ? sqliteSchema.resources.title
      : sqliteSchema.resources.createdAt
  const orderDir = options.orderDir === "asc" ? asc : desc

  const rows = db
    .select()
    .from(sqliteSchema.resources)
    .where(where)
    .orderBy(orderDir(orderColumn))
    .limit(limit)
    .offset(offset)
    .all()

  const total = db
    .select({ count: sqliteSchema.resources.id })
    .from(sqliteSchema.resources)
    .where(where)
    .all().length

  return { resources: rows as Resource[], total }
}

export function getResource(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  id: string,
): Resource | undefined {
  return db
    .select()
    .from(sqliteSchema.resources)
    .where(eq(sqliteSchema.resources.id, id))
    .get() as Resource | undefined
}

export function createResource(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  input: ResourceInput,
): Resource {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.insert(sqliteSchema.resources)
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
  }
}

export function deleteResource(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  id: string,
): boolean {
  const result = db
    .delete(sqliteSchema.resources)
    .where(eq(sqliteSchema.resources.id, id))
    .run()
  return result.changes > 0
}
