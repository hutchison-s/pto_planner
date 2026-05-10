import { computed, onMounted, ref, watch } from 'vue'
import { defaultPaidHolidayIds, isPaidHoliday } from '~/utils/holidays'

export type AccrualFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'

export type PtoSettings = {
  accrualAmount: number | null
  accrualFrequency: AccrualFrequency | ''
  balanceAdjustments: BalanceAdjustment[]
  customPaidHolidayDates: string[]
  initialSetupComplete: boolean
  paidHolidayIds: string[]
  startingBalance: number | null
  startingDate: string
  scheduledPto: Record<string, number>
}

export type BalanceAdjustment = {
  id: string
  date: string
  balance: number
  note: string
}

const storageKey = 'pto-planner-settings'

const defaultSettings: PtoSettings = {
  accrualAmount: null,
  accrualFrequency: '',
  balanceAdjustments: [],
  customPaidHolidayDates: [],
  initialSetupComplete: false,
  paidHolidayIds: [...defaultPaidHolidayIds],
  startingBalance: null,
  startingDate: '',
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

    return settings.value.accrualFrequency ? labels[settings.value.accrualFrequency] : 'Not set'
  })

  return {
    settings,
    frequencyLabel,
    calculateBalanceOn,
    getAccrualDatesBetween,
    getScheduledPtoHours,
    setScheduledPtoHours,
    resetBalanceCorrections,
    resetPlannedPto,
    resetSettings
  }
}

export function calculateBalanceOn(targetDate: Date) {
  if (!hasCompleteInitialSetup(settings.value)) return 0

  const startDate = parseLocalDate(settings.value.startingDate)
  const startingBalance = Number(settings.value.startingBalance ?? 0)
  const accrualAmount = Number(settings.value.accrualAmount ?? 0)
  if (targetDate < startDate) return startingBalance

  const anchor = getBalanceAnchor(startDate, targetDate, startingBalance)
  const calculationStartDate = addDays(anchor.date, 1)
  const accruedHours = getAccrualDatesBetween(calculationStartDate, targetDate).length * accrualAmount
  const scheduledHours = getScheduledPtoHoursBetween(calculationStartDate, targetDate)

  return anchor.balance + accruedHours - scheduledHours
}

export function getAccrualDatesBetween(startDate: Date, endDate: Date) {
  if (!hasCompleteInitialSetup(settings.value)) return []

  const anchorDate = parseLocalDate(settings.value.startingDate)
  const dates: Date[] = []
  let cursor = new Date(anchorDate)

  while (cursor <= endDate) {
    if (cursor >= startDate && cursor > anchorDate) {
      dates.push(new Date(cursor))
    }

    cursor = nextAccrualDate(cursor, settings.value.accrualFrequency as AccrualFrequency)
  }

  return dates
}

export function resetSettings() {
  settings.value = {
    ...defaultSettings,
    balanceAdjustments: [],
    customPaidHolidayDates: [],
    scheduledPto: {}
  }
}

export function resetPlannedPto() {
  settings.value = {
    ...settings.value,
    scheduledPto: {}
  }
}

export function resetBalanceCorrections() {
  settings.value = {
    ...settings.value,
    balanceAdjustments: []
  }
}

export function getScheduledPtoHours(date: Date) {
  if (isPaidHoliday(date, settings.value.paidHolidayIds, settings.value.customPaidHolidayDates)) return 0

  return settings.value.scheduledPto[toDateInputValue(date)] ?? 0
}

export function setScheduledPtoHours(date: Date, hours: number) {
  const dateKey = toDateInputValue(date)
  const nextScheduledPto = { ...settings.value.scheduledPto }

  if (isPaidHoliday(date, settings.value.paidHolidayIds, settings.value.customPaidHolidayDates)) {
    delete nextScheduledPto[dateKey]
  } else if (hours > 0) {
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
    if (isPaidHoliday(date, settings.value.paidHolidayIds, settings.value.customPaidHolidayDates)) return total
    return total + hours
  }, 0)
}

function getBalanceAnchor(startDate: Date, targetDate: Date, startingBalance: number) {
  return settings.value.balanceAdjustments.reduce((latest, adjustment) => {
    const date = parseLocalDate(adjustment.date)

    if (date < startDate || date > targetDate || date < latest.date) return latest

    return {
      date,
      balance: adjustment.balance
    }
  }, {
    date: startDate,
    balance: startingBalance
  })
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
  const shouldClearLegacyDefaults = value.initialSetupComplete === false &&
    value.startingBalance === 40 &&
    value.accrualAmount === 4 &&
    value.accrualFrequency === 'biweekly' &&
    Boolean(value.startingDate) &&
    normalizeBalanceAdjustments(value.balanceAdjustments).length === 0 &&
    Object.keys(value.scheduledPto ?? {}).length === 0

  if (shouldClearLegacyDefaults) {
    return { ...defaultSettings }
  }

  const normalized = {
    accrualAmount: normalizeOptionalNumber(value.accrualAmount),
    accrualFrequency: normalizeAccrualFrequency(value.accrualFrequency),
    balanceAdjustments: normalizeBalanceAdjustments(value.balanceAdjustments),
    customPaidHolidayDates: normalizeDateKeys(value.customPaidHolidayDates),
    paidHolidayIds: normalizePaidHolidayIds(value.paidHolidayIds),
    startingBalance: normalizeOptionalNumber(value.startingBalance),
    initialSetupComplete: false,
    startingDate: value.startingDate ?? defaultSettings.startingDate,
    scheduledPto: value.scheduledPto ?? {}
  }

  return {
    ...normalized,
    initialSetupComplete: Boolean(value.initialSetupComplete) && hasCompleteInitialSetup(normalized)
  }
}

export function hasCompleteInitialSetup(value: Pick<PtoSettings, 'accrualAmount' | 'accrualFrequency' | 'startingBalance' | 'startingDate'>) {
  return hasFiniteNumber(value.startingBalance) &&
    hasFiniteNumber(value.accrualAmount) &&
    Boolean(value.accrualFrequency) &&
    Boolean(value.startingDate)
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeAccrualFrequency(value: unknown): AccrualFrequency | '' {
  if (value === 'weekly' || value === 'biweekly' || value === 'semimonthly' || value === 'monthly') {
    return value
  }

  return ''
}

function normalizePaidHolidayIds(value: unknown) {
  if (!Array.isArray(value)) return [...defaultPaidHolidayIds]

  return value.filter((id): id is string =>
    typeof id === 'string' && defaultPaidHolidayIds.includes(id)
  )
}

function normalizeDateKeys(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.filter((dateKey): dateKey is string =>
    typeof dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  )
}

function hasFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return false
  return Number.isFinite(Number(value))
}

function normalizeBalanceAdjustments(value?: BalanceAdjustment[]) {
  if (!Array.isArray(value)) return []

  return value
    .filter((adjustment) => adjustment.date)
    .map((adjustment) => ({
      id: adjustment.id || createId(),
      date: adjustment.date,
      balance: normalizeAdjustmentBalance(adjustment),
      note: adjustment.note || ''
    }))
}

function normalizeAdjustmentBalance(adjustment: BalanceAdjustment | (Partial<BalanceAdjustment> & { hours?: number })) {
  const balance = 'balance' in adjustment ? adjustment.balance : adjustment.hours
  const numericBalance = Number(balance ?? 0)

  return Number.isFinite(numericBalance) ? numericBalance : 0
}

export function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function parseLocalDate(value: string) {
  if (!value) return startOfDay(new Date())

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return startOfDay(new Date())
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
