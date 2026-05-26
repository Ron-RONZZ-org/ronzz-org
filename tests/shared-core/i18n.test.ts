import { detectLocale, tr_multi } from "@ronzz/shared-core"
import { describe, expect, it } from "vitest"

describe("tr_multi", () => {
  it("returns French when fr locale is passed", () => {
    expect(tr_multi("fr", "Bonjour", "Saluton", "Hello")).toBe("Bonjour")
  })

  it("returns Esperanto when eo locale is passed", () => {
    expect(tr_multi("eo", "Bonjour", "Saluton", "Hello")).toBe("Saluton")
  })

  it("returns English when en locale is passed", () => {
    expect(tr_multi("en", "Bonjour", "Saluton", "Hello")).toBe("Hello")
  })

  it("supports key-based lookup with locale", () => {
    expect(tr_multi("en", "nav.home")).toBe("Home")
  })

  it("supports key-based lookup with template vars", () => {
    expect(tr_multi("en", "pagination.page", { page: 1, total: 5 })).toBe("Page 1 of 5")
  })
})

describe("detectLocale", () => {
  it("returns fr for French Accept-Language", () => {
    expect(detectLocale("fr-FR,fr;q=0.9")).toBe("fr")
  })

  it("returns eo for Esperanto", () => {
    expect(detectLocale("eo,en;q=0.8")).toBe("eo")
  })

  it("returns en for English", () => {
    expect(detectLocale("en-US,en;q=0.9")).toBe("en")
  })

  it("defaults to fr for unknown locales", () => {
    expect(detectLocale("de,ja;q=0.8")).toBe("fr")
  })

  it("defaults to fr for null", () => {
    expect(detectLocale(null)).toBe("fr")
  })
})
