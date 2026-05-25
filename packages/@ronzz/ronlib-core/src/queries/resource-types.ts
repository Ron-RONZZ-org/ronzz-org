import { eq } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { Database } from "database/db-types"
import { queryAll, queryGet, queryRun } from "database/dialect-query"
import type { ResourceType, ResourceTypeInput } from "../types"

/** Narrow the dual-dialect DB union to a minimal compatible type for Drizzle chain calls. */
// biome-ignore lint/suspicious/noExplicitAny: Drizzle union type incompatibility between PG and SQLite builders
const d = (db: Database): any => db

export async function listResourceTypes(
  db: Database,
): Promise<ResourceType[]> {
  const rows = await queryAll<ResourceType>(
    d(db).select().from(schema.resourceTypes),
  )
  return rows as ResourceType[]
}

export async function getResourceTypeBySlug(
  db: Database,
  slug: string,
): Promise<ResourceType | undefined> {
  const row = await queryGet<ResourceType>(
    d(db)
      .select()
      .from(schema.resourceTypes)
      .where(eq(schema.resourceTypes.slug, slug)),
  )
  return row as ResourceType | undefined
}

export async function createResourceType(
  db: Database,
  input: ResourceTypeInput,
): Promise<ResourceType> {
  const id = crypto.randomUUID()
  await queryRun(
    d(db)
      .insert(schema.resourceTypes)
      .values({ ...input, id }),
  )
  return { id, ...input }
}
