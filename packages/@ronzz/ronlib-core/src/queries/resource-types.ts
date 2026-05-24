import { eq } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { ResourceType, ResourceTypeInput } from "../types"

export async function listResourceTypes(
  db: any,
): Promise<ResourceType[]> {
  const rows = await db.select().from(schema.resourceTypes).all()
  return rows as ResourceType[]
}

export async function getResourceTypeBySlug(
  db: any,
  slug: string,
): Promise<ResourceType | undefined> {
  const row = await db
    .select()
    .from(schema.resourceTypes)
    .where(eq(schema.resourceTypes.slug, slug))
    .get()
  return row as ResourceType | undefined
}

export async function createResourceType(
  db: any,
  input: ResourceTypeInput,
): Promise<ResourceType> {
  const id = crypto.randomUUID()
  await db.insert(schema.resourceTypes)
    .values({ ...input, id })
    .run()
  return { id, ...input }
}
