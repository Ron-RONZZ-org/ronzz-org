import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async () => {
  let dbStatus = "disconnected"

  try {
    const { getDb } = await import("database/db")
    const db = getDb()
    if (db) {
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
