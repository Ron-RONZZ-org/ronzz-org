<script lang="ts">
  import { tr_multi } from "@ronzz/shared-core"
  import type { Locale } from "@ronzz/shared-core"

  let {
    locale = "fr" as Locale,
  }: {
    locale?: Locale
  } = $props()
</script>

<footer class="border-t border-gray-200 bg-gray-50">
  <div class="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-gray-600">
    <p class="mb-1">
      &copy; {new Date().getFullYear()} Ron &mdash; ronzz.org
    </p>
    <p class="mb-1">
      {tr_multi(
        locale,
        "Ce site est un logiciel libre sous licence AGPL v3.",
        "Ĉi tiu retejo estas libera programaro sub permesilo AGPL v3.",
        "This site is free software under AGPL v3 license.",
      )}
      <a
        href="https://github.com/Ron-RONZZ-org/ronzz-org"
        class="ml-1 text-blue-600 underline hover:text-blue-800"
        target="_blank"
        rel="noopener noreferrer"
      >
        {tr_multi(locale, "Code source", "Fontkodo", "Source code")}
      </a>
    </p>
  </div>
</footer>
