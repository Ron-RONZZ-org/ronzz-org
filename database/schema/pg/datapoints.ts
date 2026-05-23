import { pgTable, text, timestamp, real, jsonb } from "drizzle-orm/pg-core"
import { datasets } from "./datasets"

export const datapoints = pgTable("datapoint", {
  id: text("id").primaryKey(),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => datasets.id),
  dimensionKey: text("dimension_key").notNull().default(""),
  dimensionValue: text("dimension_value").notNull().default(""),
  value: real("value").notNull(),
  unit: text("unit").notNull().default(""),
  year: text("year").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
