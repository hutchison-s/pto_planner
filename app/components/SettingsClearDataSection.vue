<template>
  <section class="mt-5 rounded-section border border-brand-line bg-brand-panel p-5 shadow-soft sm:p-6">
    <button
      class="flex w-full items-start justify-between gap-3 text-left focus:outline-none focus:ring-4 focus:ring-brand-line sm:pointer-events-none sm:focus:ring-0"
      type="button"
      @click="$emit('toggle')"
    >
      <span>
        <span class="block text-sm font-semibold text-brand-orange">
          Clear Data
        </span>
        <span class="mt-1 block text-2xl font-bold tracking-normal">
          Reset this planner
        </span>
      </span>
      <ChevronDown
        class="h-5 w-5 shrink-0 text-brand-orange transition sm:hidden"
        :class="isOpen ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <div
      class="sm:block"
      :class="isOpen ? 'block' : 'hidden'"
    >
      <div class="mt-5 rounded-card border border-orange-200 bg-brand-orangeSoft px-4 py-3 text-sm text-brand-ink">
        This clears your initial setup, balance corrections, and scheduled PTO from this browser. This action is irreversible.
      </div>

      <button
        class="mt-4 rounded-button bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-brand-line"
        type="button"
        @click="$emit('clear')"
      >
        Clear all data
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

defineEmits<{
  clear: []
  toggle: []
}>()

defineProps<{
  isOpen: boolean
}>()
</script>
