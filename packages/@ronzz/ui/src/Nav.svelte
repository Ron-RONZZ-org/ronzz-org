<script lang="ts">
  import { tr_multi, t } from "@ronzz/shared-core"
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

  const navLinks = [
    { href: "/", labelKey: "nav.home" },
    { href: "/lib", label: "RonLib" },
    { href: "/stats", label: "RonStats" },
    { href: "/encik", label: "RonEncik" },
  ]

  const localeOptions: { value: Locale; label: string }[] = [
    { value: "fr", label: "FR" },
    { value: "eo", label: "EO" },
    { value: "en", label: "EN" },
  ]

  function switchLocale(newLocale: Locale) {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    window.location.reload()
  }
</script>

<nav class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
  <a href="/" class="text-lg font-bold text-gray-900">ronzz.org</a>

  <div class="flex items-center gap-4">
    {#each navLinks as link}
      <a
        href={link.href}
        class="text-sm text-gray-600 transition-colors hover:text-gray-900 {isActive(link.href) ? 'font-semibold text-blue-600' : ''}"
      >
        {link.label ?? t(locale, link.labelKey)}
      </a>
    {/each}

    <div class="ml-4 flex items-center gap-1 border-l border-gray-200 pl-4">
      {#each localeOptions as opt}
        <button
          onclick={() => switchLocale(opt.value)}
          class="text-xs px-2 py-1 rounded transition-colors {locale === opt.value
            ? 'bg-blue-600 text-white'
            : 'text-gray-500 hover:text-gray-900'}"
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </div>
</nav>
