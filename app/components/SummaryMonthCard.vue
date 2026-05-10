<template>
  <NuxtLink
    class="block rounded-card border border-brand-line bg-brand-panel p-3 shadow-card transition hover:border-brand-blue hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
    :to="{ path: '/', query: { month: month.key } }"
  >
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-base font-bold tracking-normal text-brand-ink">
        {{ month.label }}
      </h2>
      <p class="text-xs font-semibold text-brand-muted">
        End <span class="text-brand-ink">{{ formatHours(month.endBalance) }}h</span>
      </p>
    </div>

    <div class="grid grid-cols-[repeat(7,minmax(0,1fr))_4.25rem] gap-1 text-center text-[10px] font-semibold text-brand-muted">
      <div
        v-for="day in weekdayLabels"
        :key="day"
        class="py-1"
      >
        {{ day }}
      </div>
      <div class="py-1 text-right">
        EOW
      </div>
    </div>

    <div class="mt-1 grid gap-1">
      <div
        v-for="week in month.weeks"
        :key="week.key"
        class="grid grid-cols-[repeat(7,minmax(0,1fr))_4.25rem] gap-1"
      >
        <div
          v-for="day in week.days"
          :key="day.key"
          class="relative flex aspect-square min-h-8 items-center justify-center rounded-lg border text-xs font-semibold"
          :class="getDayToneClass(day)"
        >
          {{ day.dayNumber }}
          <Star
            v-if="day.holidayLabel"
            class="absolute bottom-0.5 right-0.5 h-2 w-2 fill-current"
            :class="hasSolidBackground(day) ? 'text-white' : 'text-amber-500'"
            aria-hidden="true"
          />
        </div>
        <div
          class="flex min-h-8 items-center justify-end rounded-lg border border-brand-lineSoft bg-white px-1 text-xs font-bold"
          :class="week.endBalance <= 0 ? 'text-red-700' : week.endBalance < fullDayHours ? 'text-brand-orange' : 'text-brand-ink'"
        >
          {{ formatHours(week.endBalance) }}h
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import type { CalendarDay } from '~/types/calendar'
import type { SummaryMonthData } from '~/types/summary'

const fullDayHours = 8
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

defineProps<{
  month: SummaryMonthData
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
