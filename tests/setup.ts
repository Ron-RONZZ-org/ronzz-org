import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { closeRateLimiter } from "@ronzz/shared-core"
import { closeDb } from "database/db"
import { afterEach, beforeEach } from "vitest"

/**
 * Test isolation fixture — runs before each test.
 * Redirects DB and config paths to a temporary directory
 * to prevent cross-test contamination.
 */
beforeEach(() => {
  const tmpDir = mkdtempSync(join(tmpdir(), "ronzz-test-"))

  // Redirect database to in-memory SQLite
  process.env.DATABASE_URL = ":memory:"

  // Redirect config/cache paths
  process.env.XDG_CONFIG_HOME = join(tmpDir, "config")
  process.env.XDG_DATA_HOME = join(tmpDir, "data")
})

/** Clean up rate limiter interval and DB connections after each test. */
afterEach(async () => {
  closeRateLimiter()
  await closeDb()
})
