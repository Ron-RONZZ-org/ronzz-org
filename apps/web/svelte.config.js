import adapter from "@sveltejs/adapter-node"
import { mdsvex } from "mdsvex"

/** @type {import("@sveltejs/kit").Config} */
const config = {
  extensions: [".svelte", ".svx"],
  preprocess: [mdsvex({ extensions: [".svx"] })],
  kit: {
    adapter: adapter(),
    prerender: {
      handleHttpError: "warn",
    },
    alias: {
      $ui: "../../packages/@ronzz/ui/src",
    },
  },
}

export default config
