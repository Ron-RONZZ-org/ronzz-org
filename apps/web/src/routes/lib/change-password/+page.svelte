<script lang="ts">
  import { Button } from "@ronzz/ui"
  import { tr_multi } from "@ronzz/shared-core"
  import type { Locale } from "@ronzz/shared-core"
  import { enhance } from "$app/forms"

  let { data }: { data: { locale: Locale } } = $props()
  const locale = data.locale

  let currentPassword = $state("")
  let newPassword = $state("")
  let confirmPassword = $state("")
</script>

<section class="mx-auto max-w-md py-12">
  <h1 class="mb-2 text-center text-2xl font-bold text-gray-900">
    {tr_multi(locale, "Changement de mot de passe", "Ŝanĝi pasvorton", "Change Password")}
  </h1>
  <p class="mb-8 text-center text-sm text-gray-600">
    {tr_multi(locale,
      "Vous devez changer votre mot de passe avant de continuer.",
      "Vi devas ŝanĝi vian pasvorton antaŭ ol daŭrigi.",
      "You must change your password before continuing.",
    )}
  </p>

  <form
    method="POST"
    action="?/changePassword"
    class="space-y-6"
    use:enhance
  >
    <div class="flex flex-col gap-1">
      <label for="currentPassword" class="text-sm font-medium text-gray-700">
        {tr_multi(locale, "Mot de passe actuel", "Nuna pasvorto", "Current Password")}
      </label>
      <input
        id="currentPassword"
        name="currentPassword"
        type="password"
        required
        bind:value={currentPassword}
        class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label for="newPassword" class="text-sm font-medium text-gray-700">
        {tr_multi(locale, "Nouveau mot de passe", "Nova pasvorto", "New Password")}
      </label>
      <input
        id="newPassword"
        name="newPassword"
        type="password"
        required
        minlength={8}
        bind:value={newPassword}
        class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label for="confirmPassword" class="text-sm font-medium text-gray-700">
        {tr_multi(locale, "Confirmer le mot de passe", "Konfirmi pasvorton", "Confirm Password")}
      </label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        required
        minlength={8}
        bind:value={confirmPassword}
        class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <Button type="submit" variant="primary">
      {tr_multi(locale, "Changer le mot de passe", "Ŝanĝi pasvorton", "Change Password")}
    </Button>
  </form>
</section>
