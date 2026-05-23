import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const resourceTypes = sqliteTable("resource_type", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  nameFr: text("name_fr").notNull(),
  nameEo: text("name_eo").notNull(),
  nameEn: text("name_en").notNull(),
})
