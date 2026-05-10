<template>
  <header class="fixed inset-x-0 top-0 z-30 border-b border-brand-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <NuxtLink
          class="text-3xl font-black leading-none tracking-normal text-brand-blue transition hover:text-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
          aria-label="Go to Summary"
          to="/"
        >
          PTO
        </NuxtLink>
        <div>
          <p class="text-sm font-bold leading-tight text-brand-ink">
            {{ title }}
          </p>
          <p class="text-xs font-semibold leading-tight text-brand-muted">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <nav class="hidden items-center gap-2 md:flex" aria-label="Primary">
        <NuxtLink
          v-for="link in visibleNavLinks"
          :key="link.to"
          class="rounded-button px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-brand-line"
          :class="isActive(link.to) ? 'bg-brand-blue text-white shadow-button' : 'border border-brand-line bg-white text-brand-blue shadow-card hover:bg-brand-blueSoft'"
          :to="link.to"
        >
          {{ link.label }}
        </NuxtLink>
        <button
          v-if="authUser"
          class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          type="button"
          @click="signOut"
        >
          Log out
        </button>
        <NuxtLink
          v-else
          class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          to="/login"
        >
          Log in
        </NuxtLink>
      </nav>

      <div class="relative md:hidden">
        <button
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-brand-blue bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          :aria-expanded="isMenuOpen"
          aria-label="Open navigation menu"
          type="button"
          @click="isMenuOpen = !isMenuOpen"
        >
          <X v-if="isMenuOpen" class="h-5 w-5" aria-hidden="true" />
          <Menu v-else class="h-5 w-5" aria-hidden="true" />
        </button>

        <nav
          v-if="isMenuOpen"
          aria-label="Primary"
          class="absolute right-0 top-14 grid w-44 gap-2 rounded-card border border-brand-line bg-white p-2 shadow-soft"
        >
          <NuxtLink
            v-for="link in visibleNavLinks"
            :key="link.to"
            class="rounded-button px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-brand-line"
            :class="isActive(link.to) ? 'bg-brand-blue text-white shadow-button' : 'text-brand-blue hover:bg-brand-blueSoft'"
            :to="link.to"
            @click="isMenuOpen = false"
          >
            {{ link.label }}
          </NuxtLink>
          <button
            v-if="authUser"
            class="rounded-button px-4 py-2 text-left text-sm font-semibold text-brand-blue transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="handleSignOut"
          >
            Log out
          </button>
          <NuxtLink
            v-else
            class="rounded-button px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            to="/login"
            @click="isMenuOpen = false"
          >
            Log in
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

defineProps<{
  title: string
  subtitle: string
}>()

const route = useRoute()
const { authUser, refreshSession, signOut } = useAuthSession()
const isMenuOpen = ref(false)
const navLinks = [
  { label: 'Summary', to: '/', requiresAuth: true },
  { label: 'Planner', to: '/planner', requiresAuth: true },
  { label: 'About', to: '/about', requiresAuth: false },
  { label: 'Settings', to: '/settings', requiresAuth: true }
]
const visibleNavLinks = computed(() => navLinks.filter((link) => !link.requiresAuth || authUser.value))

onMounted(() => {
  refreshSession()
})

function isActive(path: string) {
  return route.path === path
}

async function handleSignOut() {
  isMenuOpen.value = false
  await signOut()
}
</script>
