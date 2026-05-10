<template>
  <PtoHeader
    subtitle="Monthly overview"
    title="Summary"
  />

  <main class="mx-auto min-h-screen w-full max-w-3xl px-4 pb-8 pt-24 sm:px-6">
    <SetupRequiredCard v-if="!hasInitialSetup" />

    <section v-else class="grid gap-4">
      <SummaryMonthCard
        v-for="month in summaryMonths"
        :key="month.key"
        :month="month"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarDay } from '~/types/calendar'
import type { SummaryMonthData, SummaryWeek } from '~/types/summary'
import { getHolidayLabel, isPaidHoliday } from '~/utils/holidays'

const {
  settings,
  calculateBalanceOn,
  getAccrualDatesBetween,
  getScheduledPtoHours
} = usePtoSettings()

const today = startOfDay(new Date())
const fullDayHours = 8
const hasInitialSetup = computed(() => settings.value.initialSetupComplete)
const setupStartDate = computed(() => settings.value.startingDate ? parseLocalDate(settings.value.startingDate) : today)
const summaryStartMonth = computed(() => {
  const currentMonth = startOfMonth(today)
  const initialMonth = startOfMonth(setupStartDate.value)

  return isBeforeMonth(currentMonth, initialMonth) ? initialMonth : currentMonth
})
const summaryMonths = computed(() =>
  Array.from({ length: 12 }, (_, index) => buildSummaryMonth(addMonths(summaryStartMonth.value, index)))
)

function buildSummaryMonth(date: Date): SummaryMonthData {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const accrualKeys = new Set(getAccrualDatesBetween(monthStart, monthEnd).map((accrualDate) => toDateInputValue(accrualDate)))
  const gridStart = addDays(monthStart, -monthStart.getDay())
  const days = Array.from({ length: 42 }, (_, index) => {
    const calendarDate = addDays(gridStart, index)
    const isCurrentMonth = calendarDate.getMonth() === monthStart.getMonth()
    const paidHoliday = isPaidHoliday(calendarDate, settings.value.paidHolidayIds, settings.value.customPaidHolidayDates)
    const dayBalance = calculateBalanceOn(calendarDate)

    return {
      key: calendarDate.toISOString(),
      date: calendarDate,
      dateKey: toDateInputValue(calendarDate),
      dayNumber: calendarDate.getDate(),
      holidayLabel: getHolidayLabel(calendarDate) || (paidHoliday ? 'Paid Holiday' : ''),
      isAccrualDate: isCurrentMonth && accrualKeys.has(toDateInputValue(calendarDate)),
      isCurrentMonth,
      isDepletedBalance: isCurrentMonth && dayBalance <= 0,
      isLowBalance: isCurrentMonth && dayBalance < fullDayHours,
      isPaidHoliday: isCurrentMonth && paidHoliday,
      isToday: isSameDay(calendarDate, today),
      isWeekend: calendarDate.getDay() === 0 || calendarDate.getDay() === 6,
      scheduledHours: isCurrentMonth && !paidHoliday ? getScheduledPtoHours(calendarDate) : 0
    }
  })

  return {
    key: formatMonthKey(monthStart),
    label: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    startBalance: calculateBalanceOn(monthStart),
    endBalance: calculateBalanceOn(monthEnd),
    days,
    weeks: buildWeeks(days)
  }
}

function buildWeeks(days: CalendarDay[]) {
  const weeks: SummaryWeek[] = []

  for (let index = 0; index < days.length; index += 7) {
    const weekDays = days.slice(index, index + 7)
    const lastDay = weekDays[weekDays.length - 1]

    weeks.push({
      key: weekDays[0]?.dateKey ?? String(index),
      days: weekDays,
      endBalance: lastDay ? calculateBalanceOn(lastDay.date) : 0
    })
  }

  return weeks
}

function isBeforeMonth(left: Date, right: Date) {
  return left.getFullYear() < right.getFullYear() ||
    (left.getFullYear() === right.getFullYear() && left.getMonth() < right.getMonth())
}

</script>
