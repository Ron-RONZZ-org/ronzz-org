<script lang="ts">
  import { onMount } from "svelte"
  import { Seo, Nav, Footer } from "@ronzz/ui"
  import type { Locale } from "@ronzz/shared-core"
  import { setLocale } from "@ronzz/shared-core"
  import "@ronzz/ui/app.css"
  import { page } from "$app/stores"

  let {
    children,
    data,
  }: {
    children?: import("svelte").Snippet
    data: { locale: Locale }
  } = $props()

  // Sync the i18n module locale with the server-detected locale
  $effect(() => {
    setLocale(data.locale)
  })
</script>

<Seo title="ronzz.org" description="For everything, but nothing" />
<Nav locale={data.locale} currentPath={$page.url.pathname} />
<main class="mx-auto max-w-6xl px-6 py-8">
  {#if children}
    {@render children()}
  {/if}
</main>
<Footer locale={data.locale} />
