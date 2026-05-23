export type Locale = "fr" | "eo" | "en"

/**
 * Returns the correct translation based on the current locale.
 * The default locale is French.
 *
 * Usage:
 *   tr_multi("Texte français", "Esperanta teksto", "English text")
 */
export function tr_multi(
  fr: string,
  eo: string,
  en: string,
  locale: Locale = "fr",
): string {
  const map: Record<Locale, string> = { fr, eo, en }
  return map[locale]
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
