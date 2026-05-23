import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { resourceTypes } from "./resource-types"

export const resources = pgTable("resource", {
  id: text("id").primaryKey(),
  typeId: text("type_id")
    .notNull()
    .references(() => resourceTypes.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  locale: text("locale", { enum: ["fr", "eo", "en"] }).notNull().default("fr"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
