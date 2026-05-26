import { json } from "@sveltejs/kit"
import { detectDialect } from "database/schema/proxy"
import { sql } from "drizzle-orm"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async () => {
  let dbStatus = "disconnected"

  try {
    const { getDb } = await import("database/db")
    const db = getDb()
    if (db) {
      // Ping the database to verify the connection is actually live
      // Use dialect-appropriate execution method
      if (detectDialect() === "pg") {
        // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB requires dynamic dispatch
        await (db as any).execute(sql`SELECT 1`)
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB requires dynamic dispatch
        ;(db as any).run(sql`SELECT 1`)
      }
      dbStatus = "connected"
    }
  } catch {
    dbStatus = "disconnected"
  }

  const healthy = dbStatus === "connected"

  return json(
    {
      status: healthy ? "ok" : "degraded",
      version: "0.1.0",
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    healthy ? { status: 200 } : { status: 503 },
  )
}
