<template>
  <PtoHeader
    subtitle="Edit settings"
    :title="title"
  />

  <main class="mx-auto min-h-screen w-full max-w-3xl px-4 pb-8 pt-24 sm:px-6">
    <button
      class="inline-flex items-center gap-2 rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
      type="button"
      @click="$emit('back')"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      Settings
    </button>

    <section class="mt-5 rounded-section border border-brand-line bg-white p-5 shadow-soft sm:p-6">
      <slot />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

defineEmits<{
  back: []
}>()

defineProps<{
  title: string
}>()
</script>
