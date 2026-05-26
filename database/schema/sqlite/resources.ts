import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { resourceTypes } from "./resource-types"

export const resources = sqliteTable("resource", {
  id: text("id").primaryKey(),
  typeId: text("type_id")
    .notNull()
    .references(() => resourceTypes.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  locale: text("locale", { enum: ["fr", "eo", "en"] })
    .notNull()
    .default("fr"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
})
