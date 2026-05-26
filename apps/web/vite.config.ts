import path from "node:path"
import { fileURLToPath } from "node:url"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [sveltekit()],
  css: {
    postcss: path.resolve(__dirname, "../../postcss.config.js"),
  },
  ssr: {
    noExternal: [/^@ronzz\//],
  },
})
