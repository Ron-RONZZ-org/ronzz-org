import * as sqliteSchema from "./sqlite/index"
import * as pgSchema from "./pg/index"

let _cachedDialect: "sqlite" | "pg" | null = null

function detectDialect(): "sqlite" | "pg" {
  if (_cachedDialect) return _cachedDialect
  const url = process.env.DATABASE_URL ?? ""
  _cachedDialect =
    url.startsWith("postgres") || url.startsWith("postgresql") ? "pg" : "sqlite"
  return _cachedDialect
}

/** Reset cached dialect. Used in test isolation to re-evaluate on next access. */
export function resetDialectCache(): void {
  _cachedDialect = null
}

const dialect = detectDialect()

/** Runtime-selected schema matching the active database dialect. */
export const schema: typeof sqliteSchema | typeof pgSchema =
  dialect === "pg" ? pgSchema : sqliteSchema
