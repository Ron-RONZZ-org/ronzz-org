<script lang="ts">
  import { Seo, Nav, Footer } from "@ronzz/ui"
  import type { Locale } from "@ronzz/shared-core"
  import "@ronzz/ui/app.css"
  import { page } from "$app/stores"
  import { webSiteSchema } from "@ronzz/shared-core"

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

<Seo
  title="ronzz.org"
  description="For everything, but nothing"
  {canonical}
  jsonld={webSiteSchema("ronzz.org", "https://ronzz.org")}
/>
<Nav locale={data.locale} currentPath={$page.url.pathname} />
<main class="mx-auto max-w-6xl px-6 py-8">
  {#if children}
    {@render children()}
  {/if}
</main>
<Footer locale={data.locale} />
