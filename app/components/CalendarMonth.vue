<template>
  <article
    class="rounded-card border bg-brand-panel p-4 shadow-card"
    :class="month.key === focusedMonthKey ? 'border-brand-line' : 'border-brand-lineSoft'"
  >
    <div class="mb-4 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
      <button
        v-if="month.key === focusedMonthKey"
        aria-label="Previous month"
        class="inline-flex h-10 w-10 items-center justify-center rounded-button border border-brand-line bg-white shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line"
        :class="canGoPrevious ? 'text-brand-blue hover:bg-brand-blueSoft' : 'cursor-not-allowed text-slate-300'"
        :disabled="!canGoPrevious"
        type="button"
        @click="$emit('changeMonth', -1)"
      >
        <ChevronLeft class="h-5 w-5" aria-hidden="true" />
      </button>
      <span v-else />

      <h2 class="text-center text-lg font-bold tracking-normal">
        {{ month.label }}
      </h2>

      <button
        v-if="month.key === focusedMonthKey"
        aria-label="Next month"
        class="inline-flex h-10 w-10 items-center justify-center rounded-button border border-brand-line bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
        type="button"
        @click="$emit('changeMonth', 1)"
      >
        <ChevronRight class="h-5 w-5" aria-hidden="true" />
      </button>
      <span v-else />
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-brand-muted">
      <div
        v-for="day in weekdayLabels"
        :key="day"
        class="py-2"
      >
        {{ day }}
      </div>
    </div>

    <div class="mt-1 grid grid-cols-7 gap-1">
      <button
        v-for="day in month.days"
        :key="day.key"
        class="flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl border text-sm transition focus:outline-none focus:ring-4 focus:ring-brand-line"
        :class="[getDayToneClass(day), day.dateKey === selectedDayKey ? 'ring-2 ring-brand-blue ring-offset-2' : '']"
        type="button"
        @click="$emit('selectDay', day)"
      >
        <span class="font-semibold leading-none">
          {{ day.dayNumber }}
        </span>
        <span class="mt-1 flex h-2 items-center gap-1">
          <span
            v-if="day.isAccrualDate"
            class="h-1.5 w-1.5 rounded-full"
            :class="hasSolidBackground(day) ? 'bg-white' : 'bg-brand-lime'"
          />
          <span
            v-if="day.scheduledHours > 0"
            class="h-1.5 w-1.5 rounded-full"
            :class="hasSolidBackground(day) ? 'bg-white' : 'bg-brand-magenta'"
          />
          <Star
            v-if="day.holidayLabel"
            class="h-2 w-2 fill-current"
            :class="hasSolidBackground(day) ? 'text-white' : 'text-amber-500'"
            aria-hidden="true"
          />
        </span>
      </button>
    </div>

    <div class="mt-4 flex items-center justify-between gap-3 border-t border-brand-lineSoft pt-3 text-xs font-semibold text-brand-muted">
      <p>
        Start <span class="text-brand-ink">{{ formatHours(month.startBalance) }}h</span>
      </p>
      <p>
        End <span class="text-brand-ink">{{ formatHours(month.endBalance) }}h</span>
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Star } from 'lucide-vue-next'
import type { CalendarDay, CalendarMonthData } from '~/types/calendar'

const fullDayHours = 8
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

defineEmits<{
  changeMonth: [direction: number]
  selectDay: [day: CalendarDay]
}>()

defineProps<{
  canGoPrevious: boolean
  focusedMonthKey: string
  month: CalendarMonthData
  selectedDayKey: string
}>()

function getDayToneClass(day: CalendarDay) {
  if (!day.isCurrentMonth) {
    return 'border-transparent bg-transparent text-slate-300'
  }

  if (day.isDepletedBalance) {
    return 'border-red-500 bg-red-600 text-white shadow-card'
  }

  if (day.isPaidHoliday) {
    return 'border-amber-300 bg-amber-400 text-amber-950 shadow-card'
  }

  if (day.scheduledHours > 0) {
    if (day.scheduledHours < fullDayHours) {
      return 'border-brand-magenta bg-white text-brand-magenta'
    }

    return 'border-brand-magenta bg-brand-magenta text-white shadow-card'
  }

  if (day.isLowBalance) {
    return 'border-orange-200 bg-brand-orangeSoft text-brand-orange'
  }

  if (day.isAccrualDate) {
    return 'border-lime-200 bg-brand-limeSoft text-brand-lime'
  }

  if (day.isToday) {
    return 'border-brand-blue bg-brand-blue text-white shadow-button'
  }

  if (day.isWeekend) {
    return 'border-brand-lineSoft bg-slate-50 text-brand-ink'
  }

  return 'border-brand-lineSoft bg-white text-brand-ink'
}

function hasSolidBackground(day: CalendarDay) {
  return day.isDepletedBalance || day.isToday || day.isPaidHoliday || day.scheduledHours >= fullDayHours
}

function formatHours(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value)
}
</script>
