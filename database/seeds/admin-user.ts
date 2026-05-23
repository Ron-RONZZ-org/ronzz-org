import { randomUUID } from "node:crypto"
import { hash, Algorithm } from "@node-rs/argon2"
import { eq } from "drizzle-orm"
import { getDb } from "../db"
import { users } from "../schema/sqlite/users"

const ADMIN_EMAIL = "admin@ronzz.org"
const ADMIN_PASSWORD = "admin123" // Must be changed immediately on first login

async function seedAdminUser() {
  const db = getDb()

  const existing = db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).get()

  if (existing) {
    console.log("Admin user already exists, skipping seed.")
    return
  }

  const passwordHash = await hash(ADMIN_PASSWORD, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  db.insert(users)
    .values({
      id: randomUUID(),
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    })
    .run()

  console.log(`Admin user created: ${ADMIN_EMAIL}`)
}

seedAdminUser().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
