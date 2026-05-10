<template>
  <section class="mt-5 rounded-section border border-brand-line bg-brand-panel p-5 shadow-soft sm:p-6">
    <button
      class="flex w-full items-start justify-between gap-3 text-left focus:outline-none focus:ring-4 focus:ring-brand-line sm:pointer-events-none sm:focus:ring-0"
      type="button"
      @click="$emit('toggle')"
    >
      <span>
        <span class="block text-sm font-semibold text-brand-blue">
          Paid Holidays
        </span>
        <span class="mt-1 block text-2xl font-bold tracking-normal">
          Company holidays
        </span>
        <span class="mt-1 block text-sm font-semibold text-brand-muted sm:hidden">
          {{ paidHolidayIds.length }} enabled
        </span>
      </span>
      <span class="flex items-center gap-3">
        <span class="hidden text-sm font-semibold text-brand-muted sm:inline">
          {{ paidHolidayIds.length }} enabled
        </span>
        <ChevronDown
          class="h-5 w-5 shrink-0 text-brand-blue transition sm:hidden"
          :class="isOpen ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </span>
    </button>

    <div
      class="sm:block"
      :class="isOpen ? 'block' : 'hidden'"
    >
      <p class="mt-4 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Enabled holidays show with a gold background and do not use PTO hours.
      </p>

      <div class="mt-4 grid gap-2">
        <label
          v-for="holiday in holidayDefinitions"
          :key="holiday.id"
          class="flex items-center justify-between gap-3 rounded-card border border-brand-lineSoft bg-white px-4 py-3 shadow-card"
        >
          <span class="text-sm font-semibold text-brand-ink">
            {{ holiday.label }}
          </span>
          <input
            class="h-5 w-5 rounded border-brand-line text-brand-blue focus:ring-brand-line"
            :checked="paidHolidayIds.includes(holiday.id)"
            type="checkbox"
            @change="$emit('toggleHoliday', holiday.id)"
          >
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { holidayDefinitions } from '~/utils/holidays'

defineEmits<{
  toggle: []
  toggleHoliday: [id: string]
}>()

defineProps<{
  isOpen: boolean
  paidHolidayIds: string[]
}>()
</script>
