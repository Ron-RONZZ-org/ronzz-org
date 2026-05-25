/**
 * Minimal SvelteKit RequestEvent-like object for handler testing.
 * Returns a duck-typed object matching the shape expected by route handlers.
 */
export function mockEvent(overrides?: {
  url?: string
  method?: string
  body?: unknown
  headers?: Record<string, string>
  user?: { id: string; email: string; role: "admin" | "editor" } | null
  params?: Record<string, string>
}): any {
  const url = new URL(overrides?.url ?? "http://localhost:5173/")
  const body = overrides?.body !== undefined ? JSON.stringify(overrides.body) : null
  return {
    request: new Request(url, {
      method: overrides?.method ?? "GET",
      headers: overrides?.headers ?? {},
      body,
    }),
    url,
    params: overrides?.params ?? {},
    locals: {
      user: overrides?.user ?? null,
      locale: "fr",
      requestId: "test",
      nonce: "test-nonce",
    },
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
    },
  }
}
