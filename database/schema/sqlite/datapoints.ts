import { sqliteTable, text, real } from "drizzle-orm/sqlite-core"
import { datasets } from "./datasets"

export const datapoints = sqliteTable("datapoint", {
  id: text("id").primaryKey(),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => datasets.id),
  dimensionKey: text("dimension_key").notNull().default(""),
  dimensionValue: text("dimension_value").notNull().default(""),
  value: real("value").notNull(),
  unit: text("unit").notNull().default(""),
  year: text("year").notNull().default(""),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: text("created_at").notNull(),
})
