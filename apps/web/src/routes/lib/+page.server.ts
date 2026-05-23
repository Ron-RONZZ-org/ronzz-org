import type { PageServerLoad } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { listResources, listResourceTypes } from "@ronzz/ronlib-core"

export const load: PageServerLoad = async ({ url, locals }) => {
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const typeSlug = url.searchParams.get("type") ?? undefined
  const search = url.searchParams.get("q") ?? undefined
  const page = parseInt(url.searchParams.get("page") ?? "1", 10)
  const limit = 20
  const offset = (page - 1) * limit

  let typeId: string | undefined
  if (typeSlug) {
    const type = listResourceTypes(db).find((t) => t.slug === typeSlug)
    typeId = type?.id
  }

  const { resources, total } = listResources(db, {
    typeId,
    search,
    locale: locals.locale,
    limit,
    offset,
  })

  const resourceTypes = listResourceTypes(db)

  return {
    resources,
    resourceTypes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
