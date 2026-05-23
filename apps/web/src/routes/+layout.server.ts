import { detectLocale } from "@ronzz/shared-core"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ request }) => {
  try {
    const acceptLanguage = request.headers.get("accept-language")
    const locale = detectLocale(acceptLanguage)
    return { locale }
  } catch {
    return { locale: "fr" as const }
  }
}
