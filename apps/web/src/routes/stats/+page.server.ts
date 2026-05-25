import type { PageServerLoad } from "./$types"
import { getDb } from "database/db"
import { listDatasets } from "@ronzz/ronstats-core"

export const load: PageServerLoad = async ({ url, locals }) => {
  const db = getDb()
  const search = url.searchParams.get("q") ?? undefined
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10))
  const limit = 20
  const offset = (page - 1) * limit

  const { datasets, total } = await listDatasets(db, {
    search,
    locale: locals.locale,
    limit,
    offset,
  })

  return { datasets, total, page, totalPages: Math.ceil(total / limit) }
}
