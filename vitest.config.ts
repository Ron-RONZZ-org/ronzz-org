import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, "apps/web/src/lib"),
    },
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.config.ts",
        "**/dist/",
        "**/.next/",
      ],
    },
  },
})
