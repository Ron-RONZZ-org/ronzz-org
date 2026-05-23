import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq, like, or, and } from "drizzle-orm"
import * as sqliteSchema from "database/schema/sqlite/index"
import type { Dataset, DatasetInput } from "../types"

interface ListOptions {
  search?: string
  locale?: string
  limit?: number
  offset?: number
}

function toLocale(locale?: string): "fr" | "eo" | "en" | undefined {
  if (locale === "fr" || locale === "eo" || locale === "en") return locale
  return undefined
}

export function listDatasets(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  options: ListOptions = {},
): { datasets: Dataset[]; total: number } {
  const conditions = []

  if (options.search) {
    const term = `%${options.search}%`
    conditions.push(
      or(
        like(sqliteSchema.datasets.title, term),
        like(sqliteSchema.datasets.description, term),
      ),
    )
  }
  const locale = toLocale(options.locale)
  if (locale) {
    conditions.push(eq(sqliteSchema.datasets.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const rows = db
    .select()
    .from(sqliteSchema.datasets)
    .where(where)
    .limit(limit)
    .offset(offset)
    .all()

  const total = db
    .select({ count: sqliteSchema.datasets.id })
    .from(sqliteSchema.datasets)
    .where(where)
    .all().length

  return { datasets: rows as Dataset[], total }
}

export function getDataset(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  id: string,
): Dataset | undefined {
  return db
    .select()
    .from(sqliteSchema.datasets)
    .where(eq(sqliteSchema.datasets.id, id))
    .get() as Dataset | undefined
}

export function createDataset(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  input: DatasetInput,
): Dataset {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.insert(sqliteSchema.datasets)
    .values({
      id,
      title: input.title,
      description: input.description ?? "",
      source: input.source ?? "",
      sourceUrl: input.sourceUrl ?? "",
      license: input.license ?? "",
      locale: input.locale ?? "fr",
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
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  }
}

export function deleteDataset(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  id: string,
): boolean {
  const result = db
    .delete(sqliteSchema.datasets)
    .where(eq(sqliteSchema.datasets.id, id))
    .run()
  return result.changes > 0
}
