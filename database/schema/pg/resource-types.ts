import { pgTable, text } from "drizzle-orm/pg-core"

export const resourceTypes = pgTable("resource_type", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  nameFr: text("name_fr").notNull(),
  nameEo: text("name_eo").notNull(),
  nameEn: text("name_en").notNull(),
})
