import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./schema/sqlite/index.ts",
  out: "./migrations/sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./ronzz.db",
  },
})
