<template>
  <section class="rounded-section border border-brand-line bg-white p-4 shadow-soft sm:p-6">
    <p class="text-sm font-semibold text-brand-blue">
      Day Details
    </p>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="mt-1 text-lg font-bold tracking-normal text-brand-ink">
          {{ selectedDayLabel }}
        </h2>
        <p
          v-if="holidayLabel"
          class="mt-1 text-sm text-brand-muted"
        >
          Holiday: <span class="font-semibold text-brand-ink">{{ holidayLabel }}</span>
        </p>
        <p
          v-if="isPtoSchedulingDisabled"
          class="mt-1 text-sm font-semibold text-amber-700"
        >
          Paid holiday. PTO scheduling is disabled.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:min-w-72">
        <BalanceStat label="Balance" :value="balance" />
        <div class="rounded-xl bg-brand-limeSoft px-2 py-2">
          <p class="text-[11px] font-semibold leading-tight text-brand-muted sm:text-xs">
            Accrual
          </p>
          <p class="mt-1 text-base font-bold leading-tight tracking-normal text-brand-lime sm:text-lg">
            {{ accrualLabel }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-3">
      <p class="text-xs font-semibold leading-tight text-brand-muted">
        Schedule PTO
      </p>
      <div class="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
        <button
          :class="ptoOptionClass(isFullDaySelected)"
          :disabled="isPtoSchedulingDisabled"
          type="button"
          @click="$emit('toggleScheduledPto', fullDayHours)"
        >
          Full Day
        </button>
        <button
          :class="ptoOptionClass(isHalfDaySelected)"
          :disabled="isPtoSchedulingDisabled"
          type="button"
          @click="$emit('toggleScheduledPto', halfDayHours)"
        >
          Half Day
        </button>
        <button
          :class="ptoOptionClass(isCustomHoursSelected)"
          :disabled="isPtoSchedulingDisabled"
          type="button"
          @click="$emit('openHoursModal')"
        >
          {{ customHoursButtonLabel }}
        </button>
        <button
          :class="holidayOptionClass"
          type="button"
          @click="$emit('toggleHoliday')"
        >
          Holiday
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineEmits<{
  toggleScheduledPto: [hours: number]
  toggleHoliday: []
  openHoursModal: []
}>()

const props = defineProps<{
  accrualLabel: string
  balance: number
  customHoursButtonLabel: string
  fullDayHours: number
  halfDayHours: number
  holidayLabel: string
  isCustomHoursSelected: boolean
  isFullDaySelected: boolean
  isHalfDaySelected: boolean
  isHolidaySelected: boolean
  isPtoSchedulingDisabled: boolean
  selectedDayLabel: string
}>()

const holidayOptionClass = computed(() => [
  'min-w-0 rounded-button px-2 py-2 text-xs font-semibold leading-tight shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line sm:px-3 sm:text-sm',
  props.isHolidaySelected
    ? 'border border-amber-300 bg-amber-400 text-amber-950'
    : 'border border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
])

function ptoOptionClass(isSelected: boolean) {
  const baseClass = 'min-w-0 rounded-button px-2 py-2 text-xs font-semibold leading-tight shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line sm:px-3 sm:text-sm'

  if (props.isPtoSchedulingDisabled) {
    return [
      baseClass,
      'cursor-not-allowed border border-amber-200 bg-amber-50 text-amber-700 opacity-70'
    ]
  }

  return [
    baseClass,
    isSelected
      ? 'border border-brand-magenta bg-brand-magenta text-white'
      : 'border border-brand-magenta bg-white text-brand-magenta hover:bg-fuchsia-50'
  ]
}
</script>
