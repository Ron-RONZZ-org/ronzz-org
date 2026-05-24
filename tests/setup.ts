import { beforeEach, afterEach } from "vitest"
import { tmpdir } from "node:os"
import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { closeRateLimiter } from "@ronzz/shared-core"

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

/** Clean up rate limiter interval handle after each test. */
afterEach(() => {
  closeRateLimiter()
})
