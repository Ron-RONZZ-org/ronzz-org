<script lang="ts">
  import { tr_multi } from "@ronzz/shared-core"
  import type { Locale } from "@ronzz/shared-core"

  let {
    locale = "fr" as Locale,
    currentPath = "/",
  }: {
    locale?: Locale
    currentPath?: string
  } = $props()

  function isActive(linkHref: string): boolean {
    if (linkHref === "/") return currentPath === "/"
    return currentPath.startsWith(linkHref)
  }

  const links = [
    { href: "/", label: tr_multi("Accueil", "Hejmo", "Home", locale) },
    { href: "/lib", label: "RonLib" },
    { href: "/stats", label: "RonStats" },
    { href: "/encik", label: "RonEncik" },
  ]
</script>

<nav class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
  <a href="/" class="text-lg font-bold text-gray-900">ronzz.org</a>
  <div class="flex items-center gap-4">
    {#each links as link}
      <a
        href={link.href}
        class="text-sm text-gray-600 transition-colors hover:text-gray-900 {isActive(link.href) ? 'font-semibold text-blue-600' : ''}"
      >
        {link.label}
      </a>
    {/each}
  </div>
</nav>
