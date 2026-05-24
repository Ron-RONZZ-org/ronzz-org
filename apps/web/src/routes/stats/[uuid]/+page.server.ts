import type { PageServerLoad } from "./$types"
import { getDb } from "database/db"
import { getDataset, listDatapoints } from "@ronzz/ronstats-core"

export const load: PageServerLoad = async ({ params, locals }) => {
  const db = getDb()
  const dataset = await getDataset(db, params.uuid)

  if (!dataset) {
    return { dataset: null, datapoints: [] }
  }

  const datapoints = await listDatapoints(db, params.uuid)

  return { dataset, datapoints }
}
