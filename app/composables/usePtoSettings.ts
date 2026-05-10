import { computed, onMounted, ref, watch } from 'vue'
import { defaultPaidHolidayIds, isPaidHoliday } from '~/utils/holidays'

export type AccrualFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
export type SemimonthlyAccrualMode = 'daysOfMonth' | 'dayOfWeek'

export type PtoSettings = {
  accrualAmount: number | null
  accrualFrequency: AccrualFrequency | ''
  balanceAdjustments: BalanceAdjustment[]
  customPaidHolidayDates: string[]
  initialSetupComplete: boolean
  paidHolidayIds: string[]
  semimonthlyFirstDay: number
  semimonthlyMode: SemimonthlyAccrualMode
  semimonthlySecondDay: number
  semimonthlyWeekday: number
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

const defaultSettings: PtoSettings = {
  accrualAmount: null,
  accrualFrequency: '',
  balanceAdjustments: [],
  customPaidHolidayDates: [],
  initialSetupComplete: false,
  paidHolidayIds: [...defaultPaidHolidayIds],
  semimonthlyFirstDay: 1,
  semimonthlyMode: 'daysOfMonth',
  semimonthlySecondDay: 15,
  semimonthlyWeekday: 5,
  startingBalance: null,
  startingDate: '',
  scheduledPto: {}
}

const settings = ref<PtoSettings>({ ...defaultSettings })
const isReady = ref(false)
let hasStartedPersistence = false
let remoteSaveTimer: ReturnType<typeof setTimeout> | null = null
let isApplyingRemoteSettings = false

export function usePtoSettings() {
  onMounted(async () => {
    if (isReady.value) return

    await hydrateRemoteSettings()
    isReady.value = true
  })

  if (!hasStartedPersistence) {
    hasStartedPersistence = true

    watch(settings, (value) => {
      if (!isReady.value) return
      scheduleRemoteSave(value)
    }, { deep: true })
  }

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
  if (settings.value.accrualFrequency === 'semimonthly') {
    return getSemimonthlyAccrualDatesBetween(anchorDate, startDate, endDate)
  }

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

function getSemimonthlyAccrualDatesBetween(anchorDate: Date, startDate: Date, endDate: Date) {
  const dates: Date[] = []
  let cursor = startOfMonth(anchorDate)
  const endMonth = startOfMonth(endDate)

  while (cursor <= endMonth) {
    for (const accrualDate of getSemimonthlyDatesForMonth(cursor)) {
      if (accrualDate > anchorDate && accrualDate >= startDate && accrualDate <= endDate) {
        dates.push(accrualDate)
      }
    }

    cursor = addMonths(cursor, 1)
  }

  return dates.sort((left, right) => left.getTime() - right.getTime())
}

function getSemimonthlyDatesForMonth(monthDate: Date) {
  if (settings.value.semimonthlyMode === 'dayOfWeek') {
    return [
      getNthWeekdayOfMonth(monthDate, settings.value.semimonthlyWeekday, 1),
      getNthWeekdayOfMonth(monthDate, settings.value.semimonthlyWeekday, 3)
    ]
  }

  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const lastDay = endOfMonth(monthDate).getDate()
  const firstDay = Math.min(settings.value.semimonthlyFirstDay, lastDay)
  const secondDay = Math.min(settings.value.semimonthlySecondDay, lastDay)

  return [
    new Date(year, month, firstDay),
    new Date(year, month, secondDay)
  ].filter((date, index, allDates) =>
    allDates.findIndex((candidate) => isSameDay(candidate, date)) === index
  )
}

function getNthWeekdayOfMonth(monthDate: Date, weekday: number, occurrence: number) {
  const firstOfMonth = startOfMonth(monthDate)
  const offset = (weekday - firstOfMonth.getDay() + 7) % 7
  const day = 1 + offset + ((occurrence - 1) * 7)

  return new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
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
    semimonthlyFirstDay: normalizeDayOfMonth(value.semimonthlyFirstDay, defaultSettings.semimonthlyFirstDay),
    semimonthlyMode: normalizeSemimonthlyMode(value.semimonthlyMode),
    semimonthlySecondDay: normalizeDayOfMonth(value.semimonthlySecondDay, defaultSettings.semimonthlySecondDay),
    semimonthlyWeekday: normalizeWeekday(value.semimonthlyWeekday, defaultSettings.semimonthlyWeekday),
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

async function hydrateRemoteSettings() {
  try {
    const response = await $fetch<{ settings: PtoSettings | null }>('/api/pto-settings')
    if (!response.settings) return

    isApplyingRemoteSettings = true
    settings.value = normalizeSettings(response.settings)
  } catch (error) {
    console.warn('[pto-settings] Unable to load settings from database:', error)
  } finally {
    isApplyingRemoteSettings = false
  }
}

function scheduleRemoteSave(value: PtoSettings) {
  if (isApplyingRemoteSettings) return

  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer)
  }

  remoteSaveTimer = setTimeout(() => {
    void saveRemoteSettings(value)
  }, 500)
}

async function saveRemoteSettings(value: PtoSettings) {
  try {
    await $fetch('/api/pto-settings', {
      method: 'PUT',
      body: {
        settings: value
      }
    })
  } catch (error) {
    console.warn('[pto-settings] Unable to save settings to database:', error)
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

function normalizeSemimonthlyMode(value: unknown): SemimonthlyAccrualMode {
  return value === 'dayOfWeek' ? 'dayOfWeek' : 'daysOfMonth'
}

function normalizeDayOfMonth(value: unknown, fallback: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  return Math.min(31, Math.max(1, Math.trunc(numberValue)))
}

function normalizeWeekday(value: unknown, fallback: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  return Math.min(6, Math.max(0, Math.trunc(numberValue)))
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
