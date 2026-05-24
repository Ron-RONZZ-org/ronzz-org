import * as sqliteSchema from "./sqlite/index"
import * as pgSchema from "./pg/index"

function detectDialect(): "sqlite" | "pg" {
  const url = process.env.DATABASE_URL ?? ""
  if (url.startsWith("postgres") || url.startsWith("postgresql")) {
    return "pg"
  }
  return "sqlite"
}

const dialect = detectDialect()

/** Runtime-selected schema matching the active database dialect. */
export const schema: typeof sqliteSchema | typeof pgSchema =
  dialect === "pg" ? pgSchema : sqliteSchema
