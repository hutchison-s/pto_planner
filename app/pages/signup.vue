<template>
  <PtoHeader
    subtitle="Create account"
    title="Sign Up"
  />

  <main class="mx-auto min-h-screen w-full max-w-md px-4 pb-8 pt-24 sm:px-6">
    <section class="rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
      <p class="text-sm font-semibold text-brand-blue">
        Account
      </p>
      <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink">
        Create your PTO account
      </h1>

      <form class="mt-6 grid gap-4" @submit.prevent="submit">
        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Name</span>
          <input
            v-model="name"
            autocomplete="name"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            required
            type="text"
          >
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Email</span>
          <input
            v-model="email"
            autocomplete="email"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            required
            type="email"
          >
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold text-brand-muted">Password</span>
          <input
            v-model="password"
            autocomplete="new-password"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            minlength="8"
            required
            type="password"
          >
        </label>

        <p
          v-if="errorMessage"
          class="rounded-card border border-orange-200 bg-brand-orangeSoft px-4 py-3 text-sm font-semibold text-brand-orange"
        >
          {{ errorMessage }}
        </p>

        <button
          class="rounded-button bg-brand-blue px-4 py-3 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line disabled:opacity-70"
          :disabled="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? 'Creating account...' : 'Sign up' }}
        </button>
      </form>

      <p class="mt-5 text-sm text-brand-muted">
        Already have an account?
        <NuxtLink class="font-semibold text-brand-blue hover:text-brand-blueDark" to="/login">
          Log in
        </NuxtLink>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
const email = ref('')
const name = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const { refreshSession } = useAuthSession()

async function submit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/sign-up/email', {
      method: 'POST',
      body: {
        email: email.value,
        name: name.value,
        password: password.value
      }
    })
    await refreshSession()
    await navigateTo('/')
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String(error.statusMessage)
  }

  return 'Unable to create that account.'
}
</script>
