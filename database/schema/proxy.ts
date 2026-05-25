import * as sqliteSchema from "./sqlite/index"
import * as pgSchema from "./pg/index"

let _cachedDialect: "sqlite" | "pg" | null = null

export function detectDialect(): "sqlite" | "pg" {
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

/**
 * Internal storage for lazy schema initialisation.
 * Re-evaluated on each getSchema() call when dialect cache is reset.
 */
let _schema: typeof sqliteSchema | typeof pgSchema | null = null

/** Resolve the schema matching the active database dialect. */
function resolveSchema(): typeof sqliteSchema | typeof pgSchema {
  if (_schema && _cachedDialect) return _schema
  const dialect = detectDialect()
  _schema = dialect === "pg" ? pgSchema : sqliteSchema
  return _schema
}

/**
 * Runtime-selected schema matching the active database dialect.
 * Lazily evaluated so test isolation (resetDialectCache) works correctly.
 */
export function getSchema(): typeof sqliteSchema | typeof pgSchema {
  return resolveSchema()
}

/** Convenience re-export for call sites that destructure `schema.datasets` etc. */
export const schema: typeof sqliteSchema | typeof pgSchema = new Proxy(
  {} as typeof sqliteSchema | typeof pgSchema,
  {
    get(_target, prop) {
      const current = resolveSchema()
      return Reflect.get(current, prop)
    },
  },
)
