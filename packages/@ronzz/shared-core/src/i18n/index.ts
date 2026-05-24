import frCommon from "./locales/fr/common.json" with { type: "json" }
import eoCommon from "./locales/eo/common.json" with { type: "json" }
import enCommon from "./locales/en/common.json" with { type: "json" }

export type Locale = "fr" | "eo" | "en"

type TranslationBundle = Record<string, string>

const bundles: Record<Locale, TranslationBundle> = {
  fr: frCommon,
  eo: eoCommon,
  en: enCommon,
}

/**
 * Translate a key using an explicit locale's translation bundle.
 * Falls back to the key itself if not found.
 */
export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let text = bundles[locale][key]
  if (!text) {
    // Try English fallback
    text = bundles.en[key]
  }
  if (!text) return key

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

/**
 * Returns the correct translation based on an explicit locale.
 *
 * Supports three calling conventions:
 *   1) tr_multi(locale, "Texte", "Teksto", "Text")  — inline triple
 *   2) tr_multi(locale, "nav.home")                   — key lookup
 *   3) tr_multi(locale, "pagination.page", { page: 2 }) — key lookup with template vars
 */
export function tr_multi(
  locale: Locale,
  frOrKey: string,
  eoOrVars?: string | Record<string, string | number>,
  en?: string,
): string {
  // Key-based lookup: tr_multi(locale, "key") or tr_multi(locale, "key", { vars })
  if (eoOrVars === undefined && en === undefined) {
    return t(locale, frOrKey)
  }
  if (typeof eoOrVars === "object" && en === undefined) {
    return t(locale, frOrKey, eoOrVars)
  }

  // Inline triple
  const map: Record<Locale, string> = {
    fr: frOrKey,
    eo: eoOrVars as string,
    en: en as string,
  }
  return map[locale]
}

/**
 * Normalize a locale string to a valid Locale, or undefined if invalid.
 * Can be used to filter/sanitize user-provided locale values in queries.
 */
export function toLocale(locale?: string): "fr" | "eo" | "en" | undefined {
  if (locale === "fr" || locale === "eo" || locale === "en") return locale
  return undefined
}

/**
 * Detect locale from Accept-Language header.
 * Defaults to French if no match.
 */
export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return "fr"

  const langs = acceptLanguage
    .split(",")
    .map((l) => l.split(";")[0].trim().toLowerCase())

  for (const lang of langs) {
    if (lang.startsWith("fr")) return "fr"
    if (lang.startsWith("eo")) return "eo"
    if (lang.startsWith("en")) return "en"
  }

  return "fr"
}
