import { describe, it, expect } from "vitest"
import { tr_multi, detectLocale, setLocale, getLocale } from "@ronzz/shared-core"

describe("tr_multi", () => {
  it("returns French by default", () => {
    setLocale("fr")
    expect(tr_multi("Bonjour", "Saluton", "Hello")).toBe("Bonjour")
  })

  it("returns Esperanto when eo locale is set", () => {
    setLocale("eo")
    expect(tr_multi("Bonjour", "Saluton", "Hello")).toBe("Saluton")
  })

  it("returns English when en locale is set", () => {
    setLocale("en")
    expect(tr_multi("Bonjour", "Saluton", "Hello")).toBe("Hello")
  })

  it("resets to fr for subsequent calls", () => {
    setLocale("fr")
    expect(tr_multi("Bonjour", "Saluton", "Hello")).toBe("Bonjour")
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
