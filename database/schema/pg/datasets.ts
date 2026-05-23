import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"

export const datasets = pgTable("dataset", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  source: text("source").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  license: text("license").notNull().default(""),
  locale: text("locale", { enum: ["fr", "eo", "en"] }).notNull().default("fr"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
