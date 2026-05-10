<template>
  <header class="fixed inset-x-0 top-0 z-30 border-b border-brand-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="text-3xl font-black leading-none tracking-normal text-brand-blue">
          PTO
        </div>
        <div>
          <p class="text-sm font-bold leading-tight text-brand-ink">
            {{ currentMonthLabel }}
          </p>
          <p class="text-xs font-semibold leading-tight text-brand-muted">
            Balance {{ formatHours(currentBalance) }}h
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink
          aria-label="Settings"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-brand-blue bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
          to="/settings"
        >
          <Settings class="h-5 w-5" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </header>

  <main class="mx-auto min-h-screen w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
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
            v-if="selectedHolidayLabel"
            class="mt-1 text-sm text-brand-muted"
          >
            Holiday: <span class="font-semibold text-brand-ink">{{ selectedHolidayLabel }}</span>
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:min-w-72">
          <BalanceStat label="Balance" :value="selectedDayBalance" />
          <div class="rounded-xl bg-brand-limeSoft px-2 py-2">
            <p class="text-[11px] font-semibold leading-tight text-brand-muted sm:text-xs">
              Accrual
            </p>
            <p class="mt-1 text-base font-bold leading-tight tracking-normal text-brand-lime sm:text-lg">
              {{ selectedDayAccrualLabel }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-3">
        <p class="text-xs font-semibold leading-tight text-brand-muted">
          Schedule PTO
        </p>
        <div class="mt-2 grid grid-cols-3 gap-2">
          <button
            :class="ptoOptionClass(isFullDaySelected)"
            type="button"
            @click="toggleScheduledPto(fullDayHours)"
          >
            Full Day
          </button>
          <button
            :class="ptoOptionClass(isHalfDaySelected)"
            type="button"
            @click="toggleScheduledPto(halfDayHours)"
          >
            Half Day
          </button>
          <button
            :class="ptoOptionClass(isCustomHoursSelected)"
            type="button"
            @click="openHoursModal"
          >
            {{ customHoursButtonLabel }}
          </button>
        </div>
      </div>
    </section>

    <section
      class="mt-5 lg:hidden"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    >
      <CalendarMonth
        :month="selectedMonth"
        :focused-month-key="selectedMonth.key"
        :selected-day-key="selectedDayKey"
        :on-change-month="changeMonth"
        :on-select-day="selectDay"
      />
    </section>

    <section class="mt-5 hidden max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 lg:grid lg:grid-cols-3 lg:gap-5 2xl:grid-cols-4">
      <CalendarMonth
        v-for="month in desktopMonths"
        :key="month.key"
        :month="month"
        :focused-month-key="selectedMonth.key"
        :selected-day-key="selectedDayKey"
        :on-change-month="changeMonth"
        :on-select-day="selectDay"
      />
    </section>

    <footer class="fixed inset-x-0 bottom-0 z-20 border-t border-brand-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
      <p class="mx-auto max-w-7xl text-xs text-brand-muted sm:text-sm">
        {{ settings.accrualAmount }} hours accrue {{ frequencyLabel.toLowerCase() }}. Lime days are accrual dates.
      </p>
    </footer>

    <div
      v-if="isHoursModalOpen"
      class="fixed inset-0 z-40 flex items-center justify-center bg-brand-ink/30 px-4"
      @click.self="closeHoursModal"
    >
      <section
        aria-modal="true"
        class="w-full max-w-sm rounded-section border border-brand-line bg-white p-4 shadow-soft sm:p-5"
        role="dialog"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold text-brand-ink">
            Custom Hours
          </h2>
          <button
            aria-label="Close custom hours"
            class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-brand-line bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="closeHoursModal"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <label class="mt-4 grid gap-1">
          <span class="text-xs font-semibold leading-tight text-brand-muted">
            PTO hours
          </span>
          <input
            v-model.number="customHoursDraft"
            class="h-11 rounded-card border border-brand-line bg-white px-3 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-line"
            min="0"
            step="0.25"
            type="number"
          >
        </label>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <button
            class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="clearScheduledPto"
          >
            Clear
          </button>
          <button
            class="rounded-button border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="closeHoursModal"
          >
            Cancel
          </button>
          <button
            class="rounded-button bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-brand-blueDark focus:outline-none focus:ring-4 focus:ring-brand-line"
            type="button"
            @click="saveCustomHours"
          >
            Save
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Settings, X } from 'lucide-vue-next'
import { computed, defineComponent, h, ref } from 'vue'

type CalendarDay = {
  key: string
  date: Date
  dateKey: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isAccrualDate: boolean
  isLowBalance: boolean
  scheduledHours: number
  holidayLabel: string
}

type CalendarMonth = {
  key: string
  label: string
  startBalance: number
  endBalance: number
  days: CalendarDay[]
}

const {
  settings,
  frequencyLabel,
  calculateBalanceOn,
  getAccrualDatesBetween,
  getScheduledPtoHours,
  setScheduledPtoHours
} = usePtoSettings()

const today = startOfDay(new Date())
const fullDayHours = 8
const halfDayHours = 4
const selectedDate = ref(startOfMonth(today))
const selectedDay = ref(today)
const touchStartX = ref<number | null>(null)
const isHoursModalOpen = ref(false)
const customHoursDraft = ref(0)

const selectedMonth = computed(() => buildMonth(selectedDate.value))
const currentMonthLabel = computed(() => selectedMonth.value.label)
const desktopMonths = computed(() =>
  Array.from({ length: 12 }, (_, index) => buildMonth(addMonths(selectedDate.value, index)))
)
const currentBalance = computed(() => calculateBalanceOn(today))
const selectedDayKey = computed(() => toDateInputValue(selectedDay.value))
const selectedDayBalance = computed(() => calculateBalanceOn(selectedDay.value))
const selectedDayLabel = computed(() =>
  selectedDay.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
)
const selectedDayAccrualLabel = computed(() =>
  isAccrualDate(selectedDay.value) ? `+${formatHours(settings.value.accrualAmount)}h` : 'None'
)
const selectedHolidayLabel = computed(() => getHolidayLabel(selectedDay.value))
const selectedScheduledHours = computed({
  get: () => getScheduledPtoHours(selectedDay.value),
  set: (hours) => setScheduledPtoHours(selectedDay.value, Number(hours) || 0)
})
const isFullDaySelected = computed(() => selectedScheduledHours.value === fullDayHours)
const isHalfDaySelected = computed(() => selectedScheduledHours.value === halfDayHours)
const isCustomHoursSelected = computed(() =>
  selectedScheduledHours.value > 0 && !isFullDaySelected.value && !isHalfDaySelected.value
)
const customHoursButtonLabel = computed(() =>
  isCustomHoursSelected.value ? `${formatHours(selectedScheduledHours.value)}h` : 'Hours'
)

const BalanceStat = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    return () =>
      h('article', { class: 'rounded-xl bg-brand-blueSoft px-2 py-2' }, [
        h('p', { class: 'text-[11px] font-semibold leading-tight text-brand-muted sm:text-xs' }, props.label),
        h('p', { class: 'mt-1 text-base font-bold leading-tight tracking-normal text-brand-ink sm:text-lg' }, `${formatHours(props.value)}h`)
      ])
  }
})

const CalendarMonth = defineComponent({
  props: {
    month: {
      type: Object as () => CalendarMonth,
      required: true
    },
    focusedMonthKey: {
      type: String,
      required: true
    },
    selectedDayKey: {
      type: String,
      required: true
    },
    onChangeMonth: {
      type: Function as () => (direction: number) => void,
      required: true
    },
    onSelectDay: {
      type: Function as () => (day: CalendarDay) => void,
      required: true
    }
  },
  setup(props) {
    return () =>
      h('article', {
        class: [
          'rounded-card border bg-brand-panel p-4 shadow-card',
          props.month.key === props.focusedMonthKey ? 'border-brand-line' : 'border-brand-lineSoft'
        ]
      }, [
        h('div', { class: 'mb-4 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3' }, [
          props.month.key === props.focusedMonthKey
            ? h('button', {
                'aria-label': 'Previous month',
                class: 'inline-flex h-10 w-10 items-center justify-center rounded-button border border-brand-line bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line',
                type: 'button',
                onClick: () => props.onChangeMonth(-1)
              }, [
                h(ChevronLeft, { class: 'h-5 w-5', 'aria-hidden': 'true' })
              ])
            : h('span'),
          h('h2', { class: 'text-center text-lg font-bold tracking-normal' }, props.month.label),
          props.month.key === props.focusedMonthKey
            ? h('button', {
                'aria-label': 'Next month',
                class: 'inline-flex h-10 w-10 items-center justify-center rounded-button border border-brand-line bg-white text-brand-blue shadow-card transition hover:bg-brand-blueSoft focus:outline-none focus:ring-4 focus:ring-brand-line',
                type: 'button',
                onClick: () => props.onChangeMonth(1)
              }, [
                h(ChevronRight, { class: 'h-5 w-5', 'aria-hidden': 'true' })
              ])
            : h('span')
        ]),
        h('div', { class: 'grid grid-cols-7 gap-1 text-center text-xs font-semibold text-brand-muted' },
          weekdayLabels.map((day) => h('div', { key: day, class: 'py-2' }, day))
        ),
        h('div', { class: 'mt-1 grid grid-cols-7 gap-1' },
          props.month.days.map((day) => {
            const dayToneClass = getDayToneClass(day)
            const hasSolidBackground = day.isToday || day.scheduledHours > 0

            return h('button', {
              key: day.key,
              type: 'button',
              class: [
                'flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl border text-sm transition focus:outline-none focus:ring-4 focus:ring-brand-line',
                dayToneClass,
                day.dateKey === props.selectedDayKey ? 'ring-2 ring-brand-blue ring-offset-2' : ''
              ],
              onClick: () => props.onSelectDay(day)
            }, [
              h('span', { class: 'font-semibold leading-none' }, day.dayNumber),
              h('span', { class: 'mt-1 flex h-1.5 items-center gap-1' }, [
                day.isAccrualDate
                  ? h('span', {
                      class: [
                        'h-1.5 w-1.5 rounded-full',
                        hasSolidBackground ? 'bg-white' : 'bg-brand-lime'
                      ]
                    })
                  : null,
                day.scheduledHours > 0
                  ? h('span', {
                      class: [
                        'h-1.5 w-1.5 rounded-full',
                        hasSolidBackground ? 'bg-white' : 'bg-brand-magenta'
                      ]
                    })
                  : null
              ])
            ])
          })
        ),
        h('div', { class: 'mt-4 flex items-center justify-between gap-3 border-t border-brand-lineSoft pt-3 text-xs font-semibold text-brand-muted' }, [
          h('p', [
            'Start ',
            h('span', { class: 'text-brand-ink' }, `${formatHours(props.month.startBalance)}h`)
          ]),
          h('p', [
            'End ',
            h('span', { class: 'text-brand-ink' }, `${formatHours(props.month.endBalance)}h`)
          ])
        ])
      ])
  }
})

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function changeMonth(direction: number) {
  selectedDate.value = addMonths(selectedDate.value, direction)
}

function selectDay(day: CalendarDay) {
  selectedDay.value = day.date
  selectedDate.value = startOfMonth(day.date)
}

function toggleScheduledPto(hours: number) {
  selectedScheduledHours.value = selectedScheduledHours.value === hours ? 0 : hours
}

function openHoursModal() {
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

function ptoOptionClass(isSelected: boolean) {
  return [
    'rounded-button px-3 py-2 text-sm font-semibold shadow-card transition focus:outline-none focus:ring-4 focus:ring-brand-line',
    isSelected
      ? 'border border-brand-blue bg-brand-blue text-white'
      : 'border border-brand-line bg-white text-brand-blue hover:bg-brand-blueSoft'
  ]
}

function getDayToneClass(day: CalendarDay) {
  if (!day.isCurrentMonth) {
    return 'border-transparent bg-transparent text-slate-300'
  }

  if (day.scheduledHours > 0) {
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

function buildMonth(date: Date): CalendarMonth {
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
      const holidayLabel = getHolidayLabel(calendarDate)
      const dayBalance = calculateBalanceOn(calendarDate)

      return {
        key: calendarDate.toISOString(),
        date: calendarDate,
        dateKey: toDateInputValue(calendarDate),
        dayNumber: calendarDate.getDate(),
        isCurrentMonth,
        isToday: isSameDay(calendarDate, today),
        isWeekend: calendarDate.getDay() === 0 || calendarDate.getDay() === 6,
        isAccrualDate: isCurrentMonth && accrualKeys.has(toDateInputValue(calendarDate)),
        isLowBalance: isCurrentMonth && dayBalance < fullDayHours,
        scheduledHours: isCurrentMonth ? getScheduledPtoHours(calendarDate) : 0,
        holidayLabel
      }
    })
  }
}

function isAccrualDate(date: Date) {
  return getAccrualDatesBetween(date, date).some((accrualDate) => isSameDay(accrualDate, date))
}

function getHolidayLabel(date: Date) {
  const month = date.getMonth()
  const day = date.getDate()

  if (month === 0 && day === 1) return 'New Year\'s Day'
  if (month === 0 && isNthWeekday(date, 1, 3)) return 'Martin Luther King Jr. Day'
  if (month === 1 && isNthWeekday(date, 1, 3)) return 'Presidents Day'
  if (month === 4 && isLastWeekday(date, 1)) return 'Memorial Day'
  if (month === 5 && day === 19) return 'Juneteenth'
  if (month === 6 && day === 4) return 'Independence Day'
  if (month === 8 && isNthWeekday(date, 1, 1)) return 'Labor Day'
  if (month === 9 && isNthWeekday(date, 1, 2)) return 'Indigenous Peoples Day'
  if (month === 10 && day === 11) return 'Veterans Day'
  if (month === 10 && isNthWeekday(date, 4, 4)) return 'Thanksgiving'
  if (month === 11 && day === 25) return 'Christmas Day'

  return ''
}

function isNthWeekday(date: Date, weekday: number, occurrence: number) {
  if (date.getDay() !== weekday) return false
  return Math.floor((date.getDate() - 1) / 7) + 1 === occurrence
}

function isLastWeekday(date: Date, weekday: number) {
  if (date.getDay() !== weekday) return false
  return addDays(date, 7).getMonth() !== date.getMonth()
}

function formatHours(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value)
}
</script>
