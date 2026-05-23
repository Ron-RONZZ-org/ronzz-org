<script lang="ts">
  import { tr_multi } from "@ronzz/shared-core"
  import { page } from "$app/stores"
  import type { Locale } from "@ronzz/shared-core"

  const locale: Locale = $page.data.locale ?? "fr"
</script>

<section class="py-12 text-center">
  <h1 class="mb-4 text-3xl font-bold text-gray-900">RonStats</h1>
  <p class="text-lg text-gray-600">
    {tr_multi(
      "RonStats arrive bientôt — des statistiques libres avec accès API.",
      "RonStats baldaŭ venos — liberaj statistikoj kun API-aliro.",
      "RonStats coming soon — free statistics with API access.",
      locale,
    )}
  </p>
</section>
