<template>
  <PtoHeader
    subtitle="Welcome back"
    title="Login"
  />

  <main class="mx-auto min-h-screen w-full max-w-md px-4 pb-8 pt-24 sm:px-6">
    <section class="rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
      <p class="text-sm font-semibold text-brand-blue">
        Account
      </p>
      <h1 class="mt-1 text-2xl font-bold tracking-normal text-brand-ink">
        Log in to PTO
      </h1>

      <form class="mt-6 grid gap-4" @submit.prevent="submit">
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
            autocomplete="current-password"
            class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
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
          {{ isSubmitting ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p class="mt-5 text-sm text-brand-muted">
        Need an account?
        <NuxtLink class="font-semibold text-brand-blue hover:text-brand-blueDark" to="/signup">
          Sign up
        </NuxtLink>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const { refreshSession } = useAuthSession()

async function submit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/sign-in/email', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        rememberMe: true
      }
    })
    await refreshSession()
    await navigateTo(getRedirectPath(route.query.redirect))
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

function getRedirectPath(value: unknown) {
  const redirect = Array.isArray(value) ? value[0] : value
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
}

function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'statusMessage' in error) {
    return String(error.statusMessage)
  }

  return 'Unable to log in with those credentials.'
}
</script>
