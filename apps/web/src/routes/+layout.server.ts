import { detectLocale } from "@ronzz/shared-core"
import type { LayoutServerLoad } from "./$types"
import type { Locale } from "@ronzz/shared-core"

export const load: LayoutServerLoad = async ({ request, cookies }) => {
  try {
    // Cookie takes precedence over Accept-Language
    const cookieLocale = cookies.get("locale") as Locale | undefined
    if (cookieLocale && ["fr", "eo", "en"].includes(cookieLocale)) {
      return { locale: cookieLocale }
    }

    const acceptLanguage = request.headers.get("accept-language")
    const locale = detectLocale(acceptLanguage)
    return { locale }
  } catch {
    return { locale: "fr" as const }
  }
}
