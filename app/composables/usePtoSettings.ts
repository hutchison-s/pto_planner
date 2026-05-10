import { computed, onMounted, ref, watch } from 'vue'

export type AccrualFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'

export type PtoSettings = {
  accrualAmount: number
  accrualFrequency: AccrualFrequency
  balanceAdjustments: BalanceAdjustment[]
  startingBalance: number
  startingDate: string
  scheduledPto: Record<string, number>
}

export type BalanceAdjustment = {
  id: string
  date: string
  hours: number
  note: string
}

const storageKey = 'pto-planner-settings'

const defaultSettings: PtoSettings = {
  accrualAmount: 4,
  accrualFrequency: 'biweekly',
  balanceAdjustments: [],
  startingBalance: 40,
  startingDate: toDateInputValue(new Date()),
  scheduledPto: {}
}

const settings = ref<PtoSettings>({ ...defaultSettings })
const isReady = ref(false)

export function usePtoSettings() {
  onMounted(() => {
    if (isReady.value) return

    const storedSettings = window.localStorage.getItem(storageKey)
    if (storedSettings) {
      settings.value = normalizeSettings(JSON.parse(storedSettings))
    }

    isReady.value = true
  })

  watch(settings, (value) => {
    if (!isReady.value) return
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  }, { deep: true })

  const frequencyLabel = computed(() => {
    const labels: Record<AccrualFrequency, string> = {
      weekly: 'Weekly',
      biweekly: 'Every 2 weeks',
      semimonthly: 'Twice a month',
      monthly: 'Monthly'
    }

    return labels[settings.value.accrualFrequency]
  })

  return {
    settings,
    frequencyLabel,
    calculateBalanceOn,
    getAccrualDatesBetween,
    getScheduledPtoHours,
    setScheduledPtoHours,
    resetSettings
  }
}

export function calculateBalanceOn(targetDate: Date) {
  const startDate = parseLocalDate(settings.value.startingDate)
  if (targetDate < startDate) return settings.value.startingBalance

  const accruedHours = getAccrualDatesBetween(addDays(startDate, 1), targetDate).length * settings.value.accrualAmount
  const adjustmentHours = getBalanceAdjustmentsBetween(startDate, targetDate)
  const scheduledHours = getScheduledPtoHoursBetween(addDays(startDate, 1), targetDate)

  return settings.value.startingBalance + accruedHours + adjustmentHours - scheduledHours
}

export function getAccrualDatesBetween(startDate: Date, endDate: Date) {
  const anchorDate = parseLocalDate(settings.value.startingDate)
  const dates: Date[] = []
  let cursor = new Date(anchorDate)

  while (cursor <= endDate) {
    if (cursor >= startDate && cursor > anchorDate) {
      dates.push(new Date(cursor))
    }

    cursor = nextAccrualDate(cursor, settings.value.accrualFrequency)
  }

  return dates
}

export function resetSettings() {
  settings.value = {
    ...defaultSettings,
    balanceAdjustments: [],
    scheduledPto: {}
  }
}

export function getScheduledPtoHours(date: Date) {
  return settings.value.scheduledPto[toDateInputValue(date)] ?? 0
}

export function setScheduledPtoHours(date: Date, hours: number) {
  const dateKey = toDateInputValue(date)
  const nextScheduledPto = { ...settings.value.scheduledPto }

  if (hours > 0) {
    nextScheduledPto[dateKey] = hours
  } else {
    delete nextScheduledPto[dateKey]
  }

  settings.value = {
    ...settings.value,
    scheduledPto: nextScheduledPto
  }
}

function getScheduledPtoHoursBetween(startDate: Date, endDate: Date) {
  return Object.entries(settings.value.scheduledPto).reduce((total, [dateKey, hours]) => {
    const date = parseLocalDate(dateKey)

    if (date < startDate || date > endDate) return total
    return total + hours
  }, 0)
}

function getBalanceAdjustmentsBetween(startDate: Date, endDate: Date) {
  return settings.value.balanceAdjustments.reduce((total, adjustment) => {
    const date = parseLocalDate(adjustment.date)

    if (date < startDate || date > endDate) return total
    return total + adjustment.hours
  }, 0)
}

function nextAccrualDate(date: Date, frequency: AccrualFrequency) {
  if (frequency === 'weekly') return addDays(date, 7)
  if (frequency === 'biweekly') return addDays(date, 14)
  if (frequency === 'monthly') return addMonths(date, 1)

  const day = date.getDate()
  if (day < 15) return new Date(date.getFullYear(), date.getMonth(), 15)
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function normalizeSettings(value: Partial<PtoSettings>) {
  return {
    accrualAmount: Number(value.accrualAmount ?? defaultSettings.accrualAmount),
    accrualFrequency: value.accrualFrequency ?? defaultSettings.accrualFrequency,
    balanceAdjustments: normalizeBalanceAdjustments(value.balanceAdjustments),
    startingBalance: Number(value.startingBalance ?? defaultSettings.startingBalance),
    startingDate: value.startingDate ?? defaultSettings.startingDate,
    scheduledPto: value.scheduledPto ?? {}
  }
}

function normalizeBalanceAdjustments(value?: BalanceAdjustment[]) {
  if (!Array.isArray(value)) return []

  return value
    .filter((adjustment) => adjustment.date)
    .map((adjustment) => ({
      id: adjustment.id || createId(),
      date: adjustment.date,
      hours: Number(adjustment.hours || 0),
      note: adjustment.note || ''
    }))
}

export function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

export function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
}

export function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
