import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq } from "drizzle-orm"
import * as sqliteSchema from "database/schema/sqlite/index"
import type { ResourceType, ResourceTypeInput } from "../types"

export function listResourceTypes(
  db: BetterSQLite3Database<typeof sqliteSchema>,
): ResourceType[] {
  return db.select().from(sqliteSchema.resourceTypes).all()
}

export function getResourceTypeBySlug(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  slug: string,
): ResourceType | undefined {
  return db
    .select()
    .from(sqliteSchema.resourceTypes)
    .where(eq(sqliteSchema.resourceTypes.slug, slug))
    .get()
}

export function createResourceType(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  input: ResourceTypeInput,
): ResourceType {
  const id = crypto.randomUUID()
  db.insert(sqliteSchema.resourceTypes)
    .values({ ...input, id })
    .run()
  return { id, ...input }
}
