import { type AppError, type Result, tryResult } from "@ronzz/shared-core"
import type { Database } from "database/db-types"
import { queryAll, queryGet, queryRun } from "database/dialect-query"
import { schema } from "database/schema/proxy"
import { count, desc, eq } from "drizzle-orm"
import type { Datapoint, DatapointInput } from "../types"

/** Narrow the dual-dialect DB union to a minimal compatible type for Drizzle chain calls. */
// biome-ignore lint/suspicious/noExplicitAny: Drizzle union type incompatibility between PG and SQLite builders
const d = (db: Database): any => db

export interface ListDatapointsOptions {
  limit?: number
  offset?: number
}

export async function listDatapoints(
  db: Database,
  datasetId: string,
  options?: ListDatapointsOptions,
): Promise<Datapoint[]> {
  let query = d(db)
    .select()
    .from(schema.datapoints)
    .where(eq(schema.datapoints.datasetId, datasetId))
    .orderBy(desc(schema.datapoints.createdAt))

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.offset(options.offset)
  }

  const rows = await queryAll<Datapoint>(query)
  return rows as Datapoint[]
}

export async function countDatapoints(db: Database, datasetId: string): Promise<number> {
  const result = await queryGet<{ total: number }>(
    d(db)
      .select({ total: count() })
      .from(schema.datapoints)
      .where(eq(schema.datapoints.datasetId, datasetId)),
  )
  return result?.total ?? 0
}

export async function createDatapoint(
  db: Database,
  input: DatapointInput,
): Promise<Result<Datapoint, AppError>> {
  return tryResult(async () => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await queryRun(
      d(db)
        .insert(schema.datapoints)
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
        }),
    )
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
  })
}

export async function bulkCreateDatapoints(
  db: Database,
  inputs: DatapointInput[],
): Promise<Result<Datapoint[], AppError>> {
  return tryResult(async () => {
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
    await queryRun(d(db).insert(schema.datapoints).values(values))
    return values as Datapoint[]
  })
}
