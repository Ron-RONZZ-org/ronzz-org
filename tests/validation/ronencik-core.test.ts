import { describe, it, expect } from "vitest"
import { articleMetadataSchema } from "@ronzz/ronencik-core"

describe("articleMetadataSchema", () => {
  it("accepts valid article metadata", () => {
    const result = articleMetadataSchema.safeParse({
      slug: "big-bang",
      title: "The Big Bang",
      description: "An article about the Big Bang",
      locale: "en",
      metadata: { tags: ["cosmology"] },
      publishedAt: "2025-01-01T00:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty slug", () => {
    const result = articleMetadataSchema.safeParse({
      slug: "",
      title: "Title",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty title", () => {
    const result = articleMetadataSchema.safeParse({
      slug: "test",
      title: "",
    })
    expect(result.success).toBe(false)
  })

  it("applies defaults for optional fields", () => {
    const result = articleMetadataSchema.safeParse({
      slug: "minimal",
      title: "Minimal",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe("")
      expect(result.data.locale).toBe("fr")
      expect(result.data.metadata).toEqual({})
      expect(result.data.publishedAt).toBeUndefined()
    }
  })

  it("rejects invalid locale", () => {
    const result = articleMetadataSchema.safeParse({
      slug: "test",
      title: "Test",
      locale: "de",
    })
    expect(result.success).toBe(false)
  })
})
