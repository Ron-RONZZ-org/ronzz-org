<script lang="ts">
  import { tr_multi } from "@ronzz/shared-core"
  import { page } from "$app/stores"
  import type { Locale } from "@ronzz/shared-core"

  const locale: Locale = $page.data.locale ?? "fr"
</script>

<section class="py-12 text-center">
  <h1 class="mb-4 text-3xl font-bold text-gray-900">RonEncik</h1>
  <p class="text-lg text-gray-600">
    {tr_multi(
      "RonEncik arrive bientôt — une encyclopédie animée des grandes idées.",
      "RonEncik baldaŭ venos — animita enciklopedio pri grandaj ideoj.",
      "RonEncik coming soon — an animated encyclopedia of big ideas.",
      locale,
    )}
  </p>
</section>
