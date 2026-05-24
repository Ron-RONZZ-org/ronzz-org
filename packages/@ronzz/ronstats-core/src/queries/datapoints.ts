import { eq } from "drizzle-orm"
import { schema } from "database/schema/proxy"
import type { Datapoint, DatapointInput } from "../types"

export async function listDatapoints(
  db: any,
  datasetId: string,
): Promise<Datapoint[]> {
  const rows = await db
    .select()
    .from(schema.datapoints)
    .where(eq(schema.datapoints.datasetId, datasetId))
    .all()
  return rows as Datapoint[]
}

export async function createDatapoint(
  db: any,
  input: DatapointInput,
): Promise<Datapoint> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.insert(schema.datapoints)
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

export async function bulkCreateDatapoints(
  db: any,
  inputs: DatapointInput[],
): Promise<Datapoint[]> {
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
  await db.insert(schema.datapoints).values(values).run()
  return values as Datapoint[]
}
