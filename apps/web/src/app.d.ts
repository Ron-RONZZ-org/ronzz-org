import type { Locale } from "@ronzz/shared-core"

declare global {
  namespace App {
    interface Locals {
      requestId: string
      locale: Locale
      user?: {
        id: string
        email: string
        role: "admin" | "editor"
      }
    }
  }
}

export {}
