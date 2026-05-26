import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const datasets = sqliteTable("dataset", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  source: text("source").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  license: text("license").notNull().default(""),
  locale: text("locale", { enum: ["fr", "eo", "en"] })
    .notNull()
    .default("fr"),
  chartType: text("chart_type", { enum: ["line", "bar", "pie"] })
    .notNull()
    .default("bar"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
})
