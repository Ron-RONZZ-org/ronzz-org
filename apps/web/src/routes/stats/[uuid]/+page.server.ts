import { getDataset, listDatapoints } from "@ronzz/ronstats-core"
import { error } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const db = getDb()
  const dataset = await getDataset(db, params.uuid)

  if (!dataset) {
    throw error(404, "Dataset not found")
  }

  // Cap datapoints loaded for a page view to prevent memory exhaustion on large datasets
  const datapoints = await listDatapoints(db, params.uuid, { limit: 1000 })

  return { dataset, datapoints }
}
