import { listResourceTypes, listResources } from "@ronzz/ronlib-core"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ url, locals }) => {
  const db = getDb() as Database
  const typeSlug = url.searchParams.get("type") ?? undefined
  const search = url.searchParams.get("q") ?? undefined
  const pageRaw = Number.parseInt(url.searchParams.get("page") ?? "1", 10)
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const limit = 20
  const offset = (page - 1) * limit

  let typeId: string | undefined
  if (typeSlug) {
    const types = await listResourceTypes(db)
    const type = types.find((t) => t.slug === typeSlug)
    typeId = type?.id
  }

  const { resources, total } = await listResources(db, {
    typeId,
    search,
    locale: locals.locale,
    limit,
    offset,
  })

  const resourceTypes = await listResourceTypes(db)

  return {
    resources,
    resourceTypes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
