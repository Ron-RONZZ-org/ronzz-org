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

let _currentLocale: Locale = "fr"
let _currentBundle: TranslationBundle = bundles.fr

/** Set the active locale for key-based lookups. */
export function setLocale(locale: Locale): void {
  _currentLocale = locale
  _currentBundle = bundles[locale]
}

/** Get the currently active locale. */
export function getLocale(): Locale {
  return _currentLocale
}

/**
 * Translate a key using the current locale's translation bundle.
 * Falls back to the key itself if not found.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let text = _currentBundle[key]
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
 * Returns the correct translation based on the current locale.
 * Supports two calling conventions:
 *   1) tr_multi("Texte", "Teksto", "Text") — 3 inline strings (uses current locale)
 *   2) tr_multi("nav.home")                — key lookup in translation bundle
 *   3) tr_multi("nav.home", { page: 2 })   — key lookup with template vars
 *
 * Use setLocale() to change the runtime locale.
 * For inline strings with an explicit locale, use t() instead.
 */
export function tr_multi(
  frOrKey: string,
  eoOrVars?: string | Record<string, string | number>,
  en?: string,
): string {
  // Key-based lookup: tr_multi("key") or tr_multi("key", { vars })
  if (eoOrVars === undefined && en === undefined) {
    return t(frOrKey)
  }
  if (typeof eoOrVars === "object" && en === undefined) {
    return t(frOrKey, eoOrVars)
  }

  // Inline triple
  const map: Record<Locale, string> = {
    fr: frOrKey,
    eo: eoOrVars as string,
    en: en as string,
  }
  return map[_currentLocale]
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
