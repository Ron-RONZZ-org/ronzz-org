import { createHash } from "node:crypto"
import { logger } from "@ronzz/shared-core"
import { redirect } from "@sveltejs/kit"
import { getDb } from "database/db"
import { schema } from "database/schema/proxy"
import { eq } from "drizzle-orm"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get("session")
  if (sessionId) {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
      const db = getDb() as any
      const sessionHash = createHash("sha256").update(sessionId).digest("hex")
      await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionHash))
    } catch (err) {
      logger.warn({ err }, "Failed to delete session during logout; proceeding with cookie deletion")
    }
  }
  cookies.delete("session", { path: "/" })
  redirect(303, "/lib/login")
}
