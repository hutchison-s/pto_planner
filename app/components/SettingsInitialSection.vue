<template>
  <section class="mt-5 rounded-section border border-brand-line bg-brand-panel p-5 shadow-soft sm:p-6">
    <button
      class="flex w-full items-center justify-between gap-3 text-left focus:outline-none focus:ring-4 focus:ring-brand-line sm:pointer-events-none sm:focus:ring-0"
      type="button"
      @click="$emit('toggle')"
    >
      <span>
        <span class="block text-sm font-semibold text-brand-blue">
          Initial
        </span>
        <span class="mt-1 block text-2xl font-bold tracking-normal sm:text-3xl">
          PTO accrual setup
        </span>
      </span>
      <ChevronDown
        class="h-5 w-5 shrink-0 text-brand-blue transition sm:hidden"
        :class="isOpen ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <form
      class="mt-6 gap-5 sm:grid"
      :class="isOpen ? 'grid' : 'hidden'"
      @submit.prevent
    >
      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Starting balance</span>
        <input
          v-model.number="settings.startingBalance"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          min="0"
          step="0.01"
          type="number"
          @input="$emit('setupChange')"
        >
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Starting date</span>
        <input
          v-model="settings.startingDate"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          type="date"
          @input="$emit('setupChange')"
        >
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Accrual amount</span>
        <input
          v-model.number="settings.accrualAmount"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          min="0"
          step="0.01"
          type="number"
          @input="$emit('setupChange')"
        >
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-semibold text-brand-muted">Accrual frequency</span>
        <select
          v-model="settings.accrualFrequency"
          class="rounded-card border border-brand-line bg-white px-4 py-3 text-base shadow-card outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
          @change="$emit('setupChange')"
        >
          <option disabled value="">Select frequency</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="semimonthly">Twice a month</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import type { PtoSettings } from '~/composables/usePtoSettings'

defineEmits<{
  setupChange: []
  toggle: []
}>()

defineProps<{
  isOpen: boolean
  settings: PtoSettings
}>()
</script>
