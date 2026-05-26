import { listDatasets } from "@ronzz/ronstats-core"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ url, locals }) => {
  const db = getDb() as Database
  const search = url.searchParams.get("q") ?? undefined
  const pageRaw = Number.parseInt(url.searchParams.get("page") ?? "1", 10)
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
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
