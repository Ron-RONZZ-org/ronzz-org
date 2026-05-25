import { describe, it, expect } from "vitest"
import { resourceSchema, resourceTypeSchema } from "@ronzz/ronlib-core"

describe("resourceTypeSchema", () => {
  it("accepts valid resource type", () => {
    const result = resourceTypeSchema.safeParse({
      slug: "book",
      nameFr: "Livre",
      nameEo: "Libro",
      nameEn: "Book",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty slug", () => {
    const result = resourceTypeSchema.safeParse({
      slug: "",
      nameFr: "Livre",
      nameEo: "Libro",
      nameEn: "Book",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing names", () => {
    const result = resourceTypeSchema.safeParse({
      slug: "book",
    })
    expect(result.success).toBe(false)
  })
})

describe("resourceSchema", () => {
  it("accepts valid resource input", () => {
    const result = resourceSchema.safeParse({
      typeId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test Resource",
      url: "https://example.com",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = resourceSchema.safeParse({
      typeId: "550e8400-e29b-41d4-a716-446655440000",
      title: "",
      url: "https://example.com",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid URL", () => {
    const result = resourceSchema.safeParse({
      typeId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test",
      url: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  it("accepts empty URL string", () => {
    const result = resourceSchema.safeParse({
      typeId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test",
      url: "",
    })
    expect(result.success).toBe(true)
  })

  it("applies defaults for optional fields", () => {
    const result = resourceSchema.safeParse({
      typeId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Minimal",
      url: "https://example.com",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe("")
      expect(result.data.locale).toBe("fr")
      expect(result.data.metadata).toEqual({})
    }
  })

  it("rejects invalid locale", () => {
    const result = resourceSchema.safeParse({
      typeId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test",
      url: "https://example.com",
      locale: "de",
    })
    expect(result.success).toBe(false)
  })
})
