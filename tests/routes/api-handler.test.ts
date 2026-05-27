import { describe, expect, it } from "vitest"

describe("apiHandler error behavior", () => {
  it("returns generic error message in production mode", async () => {
    const origNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"

    const { apiHandler } = await import("$lib/server/middleware")

    const handler = apiHandler(async () => {
      throw new Error("Sensitive DB error details")
    })

    const response = await handler({
      request: new Request("http://localhost:5173/test"),
      url: new URL("http://localhost:5173/test"),
      locals: { user: null, locale: "fr", requestId: "test", nonce: "test-nonce" },
    } as any)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe("Internal server error")
    expect(body.error).not.toContain("Sensitive DB error")

    process.env.NODE_ENV = origNodeEnv
  })

  it("returns error details in development mode", async () => {
    const origNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"

    const { apiHandler } = await import("$lib/server/middleware")

    const handler = apiHandler(async () => {
      throw new Error("Detailed dev error info")
    })

    const response = await handler({
      request: new Request("http://localhost:5173/test"),
      url: new URL("http://localhost:5173/test"),
      locals: { user: null, locale: "fr", requestId: "test", nonce: "test-nonce" },
    } as any)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe("Detailed dev error info")

    process.env.NODE_ENV = origNodeEnv
  })

  it("returns Response from successful handler", async () => {
    const { apiHandler } = await import("$lib/server/middleware")

    const handler = apiHandler(async () => {
      return new Response(JSON.stringify({ data: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    })

    const response = await handler({
      request: new Request("http://localhost:5173/test"),
      url: new URL("http://localhost:5173/test"),
      locals: { user: null, locale: "fr", requestId: "test", nonce: "test-nonce" },
    } as any)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toBe("ok")
  })
})
