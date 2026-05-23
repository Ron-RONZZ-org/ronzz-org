import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq } from "drizzle-orm"
import * as sqliteSchema from "database/schema/sqlite/index"
import type { Datapoint, DatapointInput } from "../types"

export function listDatapoints(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  datasetId: string,
): Datapoint[] {
  return db
    .select()
    .from(sqliteSchema.datapoints)
    .where(eq(sqliteSchema.datapoints.datasetId, datasetId))
    .all() as Datapoint[]
}

export function createDatapoint(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  input: DatapointInput,
): Datapoint {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.insert(sqliteSchema.datapoints)
    .values({
      id,
      datasetId: input.datasetId,
      dimensionKey: input.dimensionKey ?? "",
      dimensionValue: input.dimensionValue ?? "",
      value: input.value,
      unit: input.unit ?? "",
      year: input.year ?? "",
      metadata: (input.metadata ?? {}) as never,
      createdAt: now,
    })
    .run()
  return {
    id,
    datasetId: input.datasetId,
    dimensionKey: input.dimensionKey ?? "",
    dimensionValue: input.dimensionValue ?? "",
    value: input.value,
    unit: input.unit ?? "",
    year: input.year ?? "",
    metadata: input.metadata ?? {},
    createdAt: now,
  }
}

export function bulkCreateDatapoints(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  inputs: DatapointInput[],
): Datapoint[] {
  const now = new Date().toISOString()
  const values = inputs.map((input) => ({
    id: crypto.randomUUID(),
    datasetId: input.datasetId,
    dimensionKey: input.dimensionKey ?? "",
    dimensionValue: input.dimensionValue ?? "",
    value: input.value,
    unit: input.unit ?? "",
    year: input.year ?? "",
    metadata: (input.metadata ?? {}) as never,
    createdAt: now,
  }))
  db.insert(sqliteSchema.datapoints).values(values).run()
  return values as Datapoint[]
}
