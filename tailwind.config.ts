import type { Config } from "tailwindcss"

export default {
  content: ["./apps/web/src/**/*.{svelte,ts,html}", "./packages/@ronzz/ui/src/**/*.{svelte,ts}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
