<script lang="ts">
  import { Seo, Nav, Footer } from "@ronzz/ui"
  import { tr_multi, webSiteSchema } from "@ronzz/shared-core"
  import type { Locale } from "@ronzz/shared-core"
  import "@ronzz/ui/app.css"
  import { page } from "$app/stores"

  let skip = $state(false)

  let {
    children,
    data,
  }: {
    children?: import("svelte").Snippet
    data: { locale: Locale }
  } = $props()

  let canonical = $derived($page.url.origin + $page.url.pathname)

  // Sync <html lang> dynamically from page locale data
  $effect(() => {
    document.documentElement.lang = data.locale
  })
</script>

<!-- Skip-to-content link for keyboard users -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-blue-600 focus:shadow-lg"
>
  {tr_multi(data.locale, "Aller au contenu", "Salti al enhavo", "Skip to content")}
</a>

<Seo
  title="ronzz.org"
  description="For everything, but nothing"
  {canonical}
  jsonld={webSiteSchema("ronzz.org", "https://ronzz.org")}
/>
<Nav locale={data.locale} currentPath={$page.url.pathname} />
<main id="main-content" class="mx-auto max-w-6xl px-6 py-8">
  {#if children}
    {@render children()}
  {/if}
</main>
<Footer locale={data.locale} />
