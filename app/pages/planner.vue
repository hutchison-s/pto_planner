<template>
  <PtoHeader
    :subtitle="headerSubtitle"
    :title="headerTitle"
  />

  <main class="mx-auto min-h-screen w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
    <SetupRequiredCard v-if="!hasInitialSetup" />

    <template v-else>
      <DayDetailsCard
        :accrual-label="selectedDayAccrualLabel"
        :balance="selectedDayBalance"
        :custom-hours-button-label="customHoursButtonLabel"
        :full-day-hours="fullDayHours"
        :half-day-hours="halfDayHours"
        :holiday-label="selectedHolidayLabel"
        :is-custom-hours-selected="isCustomHoursSelected"
        :is-full-day-selected="isFullDaySelected"
        :is-half-day-selected="isHalfDaySelected"
        :is-holiday-selected="isSelectedDayPaidHoliday"
        :is-pto-scheduling-disabled="isSelectedDayPaidHoliday"
        :selected-day-label="selectedDayLabel"
        @open-hours-modal="openHoursModal"
        @toggle-holiday="togglePaidHolidayForSelectedDay"
        @toggle-scheduled-pto="toggleScheduledPto"
      />

      <ZeroBalanceWarning
        v-if="zeroBalanceRanges.length > 0"
        :ranges="zeroBalanceRanges"
      />

      <section
        class="mt-5 lg:hidden"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
      >
        <CalendarMonth
          :can-go-previous="canBrowsePreviousMonth"
          :focused-month-key="selectedMonth.key"
          :month="selectedMonth"
          :selected-day-key="selectedDayKey"
          @change-month="changeMonth"
          @select-day="selectDay"
        />
      </section>

      <section class="mt-5 hidden max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 lg:grid lg:grid-cols-3 lg:gap-5 2xl:grid-cols-4">
        <CalendarMonth
          v-for="month in desktopMonths"
          :key="month.key"
          :can-go-previous="canBrowsePreviousMonth"
          :focused-month-key="selectedMonth.key"
          :month="month"
          :selected-day-key="selectedDayKey"
          @change-month="changeMonth"
          @select-day="selectDay"
        />
      </section>

      <footer class="fixed inset-x-0 bottom-0 z-20 border-t border-brand-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
        <p class="mx-auto max-w-7xl text-xs text-brand-muted sm:text-sm">
          {{ formatHours(settings.accrualAmount ?? 0) }} hours accrue {{ frequencyLabel.toLowerCase() }}. Lime days are accrual dates.
        </p>
      </footer>
    </template>

    <CustomHoursModal
      v-if="hasInitialSetup && isHoursModalOpen"
      v-model="customHoursDraft"
      @clear="clearScheduledPto"
      @close="closeHoursModal"
      @save="saveCustomHours"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CalendarDay, CalendarMonthData } from '~/types/calendar'
import type { ZeroBalanceRange } from '~/components/ZeroBalanceWarning.vue'
import { getHolidayLabel, isPaidHoliday } from '~/utils/holidays'

const {
  settings,
  frequencyLabel,
  calculateBalanceOn,
  getAccrualDatesBetween,
  getScheduledPtoHours,
  setScheduledPtoHours
} = usePtoSettings()

const route = useRoute()
const today = startOfDay(new Date())
const fullDayHours = 8
const halfDayHours = 4
const initialRouteDate = getRouteMonthDate(route.query.month)
const selectedDate = ref(startOfMonth(initialRouteDate))
const selectedDay = ref(initialRouteDate)
const touchStartX = ref<number | null>(null)
const isHoursModalOpen = ref(false)
const customHoursDraft = ref(0)

const hasInitialSetup = computed(() => settings.value.initialSetupComplete)
const setupStartDate = computed(() => settings.value.startingDate ? parseLocalDate(settings.value.startingDate) : today)
const initialMonth = computed(() => startOfMonth(setupStartDate.value))
const displayedMonthDate = computed(() =>
  isBeforeMonth(selectedDate.value, initialMonth.value) ? initialMonth.value : selectedDate.value
)
const selectedMonth = computed(() => buildMonth(displayedMonthDate.value))
const currentMonthLabel = computed(() => selectedMonth.value.label)
const desktopMonths = computed(() =>
  Array.from({ length: 12 }, (_, index) => buildMonth(addMonths(displayedMonthDate.value, index)))
)
const headerTitle = computed(() => hasInitialSetup.value ? 'Current Balance' : 'Set up PTO')
const headerSubtitle = computed(() =>
  hasInitialSetup.value ? `${formatHours(currentBalance.value)}h` : 'Initial balance needed'
)
const currentBalance = computed(() => calculateBalanceOn(today))
const effectiveSelectedDay = computed(() =>
  isBeforeMonth(selectedDay.value, initialMonth.value) ? setupStartDate.value : selectedDay.value
)
const selectedDayKey = computed(() => toDateInputValue(effectiveSelectedDay.value))
const selectedDayBalance = computed(() => calculateBalanceOn(effectiveSelectedDay.value))
const canBrowsePreviousMonth = computed(() => isBeforeMonth(initialMonth.value, displayedMonthDate.value))
const selectedDayLabel = computed(() =>
  effectiveSelectedDay.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
)
const selectedDayAccrualLabel = computed(() =>
  isAccrualDate(effectiveSelectedDay.value) ? `+${formatHours(settings.value.accrualAmount ?? 0)}h` : 'None'
)
const selectedHolidayLabel = computed(() =>
  getHolidayLabel(effectiveSelectedDay.value) || (isSelectedDayPaidHoliday.value ? 'Paid Holiday' : '')
)
const isSelectedDayPaidHoliday = computed(() =>
  isPaidHoliday(effectiveSelectedDay.value, settings.value.paidHolidayIds, settings.value.customPaidHolidayDates)
)
const selectedScheduledHours = computed({
  get: () => getScheduledPtoHours(effectiveSelectedDay.value),
  set: (hours) => setScheduledPtoHours(effectiveSelectedDay.value, Number(hours) || 0)
})
const isFullDaySelected = computed(() => selectedScheduledHours.value === fullDayHours)
const isHalfDaySelected = computed(() => selectedScheduledHours.value === halfDayHours)
const isCustomHoursSelected = computed(() =>
  selectedScheduledHours.value > 0 && !isFullDaySelected.value && !isHalfDaySelected.value
)
const customHoursButtonLabel = computed(() =>
  isCustomHoursSelected.value ? `${formatHours(selectedScheduledHours.value)}h` : 'Hours'
)
const zeroBalanceRanges = computed(() => getZeroBalanceRanges(selectedMonth.value.days))

function changeMonth(direction: number) {
  const nextMonth = addMonths(displayedMonthDate.value, direction)
  selectedDate.value = isBeforeMonth(nextMonth, initialMonth.value) ? initialMonth.value : nextMonth
}

function selectDay(day: CalendarDay) {
  if (isBeforeMonth(day.date, initialMonth.value)) return

  selectedDay.value = day.date
  selectedDate.value = startOfMonth(day.date)
}

function toggleScheduledPto(hours: number) {
  if (isSelectedDayPaidHoliday.value) return

  selectedScheduledHours.value = selectedScheduledHours.value === hours ? 0 : hours
}

function togglePaidHolidayForSelectedDay() {
  const dateKey = toDateInputValue(effectiveSelectedDay.value)
  const customPaidHolidayDates = settings.value.customPaidHolidayDates.includes(dateKey)
    ? settings.value.customPaidHolidayDates.filter((existingDateKey) => existingDateKey !== dateKey)
    : [...settings.value.customPaidHolidayDates, dateKey]

  setScheduledPtoHours(effectiveSelectedDay.value, 0)
  settings.value = {
    ...settings.value,
    customPaidHolidayDates
  }
}

function isBeforeMonth(left: Date, right: Date) {
  return left.getFullYear() < right.getFullYear() ||
    (left.getFullYear() === right.getFullYear() && left.getMonth() < right.getMonth())
}

function openHoursModal() {
  if (isSelectedDayPaidHoliday.value) return

  customHoursDraft.value = selectedScheduledHours.value
  isHoursModalOpen.value = true
}

function closeHoursModal() {
  isHoursModalOpen.value = false
}

function saveCustomHours() {
  selectedScheduledHours.value = Math.max(0, Number(customHoursDraft.value) || 0)
  closeHoursModal()
}

function clearScheduledPto() {
  selectedScheduledHours.value = 0
  closeHoursModal()
}

function handleTouchStart(event: TouchEvent) {
  touchStartX.value = event.changedTouches[0]?.clientX ?? null
}

function handleTouchEnd(event: TouchEvent) {
  if (touchStartX.value === null) return

  const distance = event.changedTouches[0]?.clientX - touchStartX.value
  touchStartX.value = null

  if (Math.abs(distance) < 50) return
  changeMonth(distance < 0 ? 1 : -1)
}

function buildMonth(date: Date): CalendarMonthData {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const accrualKeys = new Set(getAccrualDatesBetween(monthStart, monthEnd).map((accrualDate) => toDateInputValue(accrualDate)))
  const gridStart = addDays(monthStart, -monthStart.getDay())

  return {
    key: formatMonthKey(monthStart),
    label: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    startBalance: calculateBalanceOn(monthStart),
    endBalance: calculateBalanceOn(monthEnd),
    days: Array.from({ length: 42 }, (_, index) => {
      const calendarDate = addDays(gridStart, index)
      const isCurrentMonth = calendarDate.getMonth() === monthStart.getMonth()
      const paidHoliday = isPaidHoliday(calendarDate, settings.value.paidHolidayIds, settings.value.customPaidHolidayDates)
      const holidayLabel = getHolidayLabel(calendarDate) || (paidHoliday ? 'Paid Holiday' : '')
      const dayBalance = calculateBalanceOn(calendarDate)

      return {
        key: calendarDate.toISOString(),
        date: calendarDate,
        dateKey: toDateInputValue(calendarDate),
        dayNumber: calendarDate.getDate(),
        isCurrentMonth,
        isDepletedBalance: isCurrentMonth && dayBalance <= 0,
        isToday: isSameDay(calendarDate, today),
        isWeekend: calendarDate.getDay() === 0 || calendarDate.getDay() === 6,
        isAccrualDate: isCurrentMonth && accrualKeys.has(toDateInputValue(calendarDate)),
        isLowBalance: isCurrentMonth && dayBalance < fullDayHours,
        isPaidHoliday: isCurrentMonth && paidHoliday,
        scheduledHours: isCurrentMonth && !paidHoliday ? getScheduledPtoHours(calendarDate) : 0,
        holidayLabel
      }
    })
  }
}

function getZeroBalanceRanges(days: CalendarDay[]) {
  const ranges: ZeroBalanceRange[] = []
  let activeRange: ZeroBalanceRange | null = null

  for (const day of days) {
    if (!day.isCurrentMonth) continue

    if (day.isDepletedBalance) {
      if (activeRange) {
        activeRange.endDate = day.date
        activeRange.endDateKey = day.dateKey
      } else {
        activeRange = {
          startDate: day.date,
          startDateKey: day.dateKey,
          endDate: day.date,
          endDateKey: day.dateKey
        }
      }

      continue
    }

    if (activeRange) {
      ranges.push(activeRange)
      activeRange = null
    }
  }

  if (activeRange) {
    ranges.push(activeRange)
  }

  return ranges
}

function isAccrualDate(date: Date) {
  return getAccrualDatesBetween(date, date).some((accrualDate) => isSameDay(accrualDate, date))
}

function formatHours(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value)
}

function getRouteMonthDate(value: unknown) {
  const monthValue = Array.isArray(value) ? value[0] : value
  if (typeof monthValue !== 'string') return today

  const match = monthValue.match(/^(\d{4})-(\d{2})$/)
  if (!match) return today

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return today

  return new Date(year, monthIndex, 1)
}
</script>
