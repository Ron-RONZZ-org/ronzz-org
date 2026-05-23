<script lang="ts">
  import { tr_multi } from "@ronzz/shared-core"
  import { page } from "$app/stores"
  import type { Locale } from "@ronzz/shared-core"

  const locale: Locale = $page.data.locale ?? "fr"
</script>

<section class="py-12 text-center">
  <h1 class="mb-4 text-3xl font-bold text-gray-900">RonLib</h1>
  <p class="text-lg text-gray-600">
    {tr_multi(
      "RonLib arrive bientôt — un catalogue de ressources soigneusement sélectionnées.",
      "RonLib baldaŭ venos — katalogo de zorge elektitaj rimedoj.",
      "RonLib coming soon — a catalog of carefully curated resources.",
      locale,
    )}
  </p>
</section>
