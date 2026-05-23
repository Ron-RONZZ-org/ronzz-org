import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./schema/pg/index.ts",
  out: "./migrations/pg",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/ronzz",
  },
})
