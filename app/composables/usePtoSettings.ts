import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { defaultPaidHolidayIds, isPaidHoliday } from '~/utils/holidays'
import { showSaveError, showSaved, showSaving } from './useSaveToast'

export type AccrualFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
export type SemimonthlyAccrualMode = 'daysOfMonth' | 'dayOfWeek'

export type PtoSettings = {
  accrualAmount: number | null
  accrualAdjustments: AccrualAdjustment[]
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

export type AccrualAdjustment = {
  accrualAmount: number | null
  accrualFrequency: AccrualFrequency | ''
  id: string
  date: string
  note: string
  semimonthlyFirstDay: number | null
  semimonthlyMode: SemimonthlyAccrualMode | ''
  semimonthlySecondDay: number | null
  semimonthlyWeekday: number | null
}

type AccrualTerms = Pick<
  PtoSettings,
  'accrualAmount' |
  'accrualFrequency' |
  'semimonthlyFirstDay' |
  'semimonthlyMode' |
  'semimonthlySecondDay' |
  'semimonthlyWeekday'
>

type AdjustmentEvent =
  | { adjustment: BalanceAdjustment, date: string, type: 'balance' }
  | { adjustment: AccrualAdjustment, date: string, type: 'accrual' }

const defaultSettings: PtoSettings = {
  accrualAmount: null,
  accrualAdjustments: [],
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
    getAccrualTermsOn,
    getScheduledPtoHours,
    setScheduledPtoHours,
    resetBalanceCorrections,
    resetPlannedPto,
    resetSettings,
    saveSettingsNow
  }
}

export function calculateBalanceOn(targetDate: Date) {
  if (!hasCompleteInitialSetup(settings.value)) return 0

  const startDate = parseLocalDate(settings.value.startingDate)
  let balance = Number(settings.value.startingBalance ?? 0)
  if (targetDate < startDate) return balance

  let cursorDate = startDate
  let terms = getInitialAccrualTerms()
  let termsAnchorDate = startDate
  let includeAnchorDate = false

  for (const event of getSortedAdjustments()) {
    const adjustmentDate = parseLocalDate(event.date)
    if (adjustmentDate < startDate || adjustmentDate > targetDate) continue

    if (event.type === 'accrual') {
      const previousSegmentEnd = addDays(adjustmentDate, -1)
      const segmentStart = addDays(cursorDate, 1)
      balance += getAccruedHoursBetween(segmentStart, previousSegmentEnd, terms, termsAnchorDate, includeAnchorDate)
      balance -= getScheduledPtoHoursBetween(segmentStart, previousSegmentEnd)

      const nextTerms = applyAdjustmentTerms(terms, event.adjustment)
      if (hasCadenceOverride(event.adjustment)) {
        termsAnchorDate = adjustmentDate
        includeAnchorDate = true
      }
      terms = nextTerms
      cursorDate = previousSegmentEnd
      continue
    }

    const segmentStart = addDays(cursorDate, 1)
    balance += getAccruedHoursBetween(segmentStart, adjustmentDate, terms, termsAnchorDate, includeAnchorDate)
    balance -= getScheduledPtoHoursBetween(segmentStart, adjustmentDate)

    balance = event.adjustment.balance
    cursorDate = adjustmentDate
  }

  const segmentStart = addDays(cursorDate, 1)
  balance += getAccruedHoursBetween(segmentStart, targetDate, terms, termsAnchorDate, includeAnchorDate)
  balance -= getScheduledPtoHoursBetween(segmentStart, targetDate)

  return balance
}

export function getAccrualDatesBetween(startDate: Date, endDate: Date) {
  if (!hasCompleteInitialSetup(settings.value)) return []

  const initialDate = parseLocalDate(settings.value.startingDate)
  let cursorDate = initialDate
  let terms = getInitialAccrualTerms()
  let termsAnchorDate = initialDate
  let includeAnchorDate = false
  const dates: Date[] = []

  for (const adjustment of getSortedAccrualAdjustments()) {
    const adjustmentDate = parseLocalDate(adjustment.date)
    if (adjustmentDate > endDate) break

    const previousSegmentEnd = addDays(adjustmentDate, -1)
    dates.push(...getAccrualDatesForTerms(
      termsAnchorDate,
      maxDate(startDate, addDays(cursorDate, 1)),
      minDate(endDate, previousSegmentEnd),
      terms,
      includeAnchorDate
    ))

    const nextTerms = applyAdjustmentTerms(terms, adjustment)
    if (hasCadenceOverride(adjustment)) {
      termsAnchorDate = adjustmentDate
      includeAnchorDate = true
    }
    terms = nextTerms
    cursorDate = previousSegmentEnd
  }

  dates.push(...getAccrualDatesForTerms(
    termsAnchorDate,
    maxDate(startDate, addDays(cursorDate, 1)),
    endDate,
    terms,
    includeAnchorDate
  ))

  return dates.sort((left, right) => left.getTime() - right.getTime())
}

export function getAccrualTermsOn(targetDate: Date) {
  let terms = getInitialAccrualTerms()
  if (!hasCompleteInitialSetup(settings.value)) return terms

  for (const event of getSortedAdjustments()) {
    if (parseLocalDate(event.date) > targetDate) break
    if (event.type === 'accrual') {
      terms = applyAdjustmentTerms(terms, event.adjustment)
    }
  }

  return terms
}

function getAccruedHoursBetween(startDate: Date, endDate: Date, terms: AccrualTerms, anchorDate: Date, includeAnchorDate = false) {
  if (endDate < startDate) return 0

  return getAccrualDatesForTerms(anchorDate, startDate, endDate, terms, includeAnchorDate).length * Number(terms.accrualAmount ?? 0)
}

function getAccrualDatesForTerms(anchorDate: Date, startDate: Date, endDate: Date, terms: AccrualTerms, includeAnchorDate = false) {
  if (endDate < startDate || !terms.accrualFrequency) return []

  if (terms.accrualFrequency === 'semimonthly') {
    return getSemimonthlyAccrualDatesBetween(anchorDate, startDate, endDate, terms, includeAnchorDate)
  }

  const dates: Date[] = []
  let cursor = new Date(anchorDate)

  while (cursor <= endDate) {
    if (cursor >= startDate && (cursor > anchorDate || (includeAnchorDate && isSameDay(cursor, anchorDate)))) {
      dates.push(new Date(cursor))
    }

    cursor = nextAccrualDate(cursor, terms.accrualFrequency as AccrualFrequency)
  }

  return dates
}

export function resetSettings() {
  settings.value = {
    ...defaultSettings,
    accrualAdjustments: [],
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

function nextAccrualDate(date: Date, frequency: AccrualFrequency) {
  if (frequency === 'weekly') return addDays(date, 7)
  if (frequency === 'biweekly') return addDays(date, 14)
  if (frequency === 'monthly') return addMonths(date, 1)

  const day = date.getDate()
  if (day < 15) return new Date(date.getFullYear(), date.getMonth(), 15)
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function getSemimonthlyAccrualDatesBetween(anchorDate: Date, startDate: Date, endDate: Date, terms: AccrualTerms, includeAnchorDate = false) {
  const dates: Date[] = []
  let cursor = startOfMonth(anchorDate)
  const endMonth = startOfMonth(endDate)

  while (cursor <= endMonth) {
    for (const accrualDate of getSemimonthlyDatesForMonth(cursor, terms)) {
      if (
        accrualDate >= startDate &&
        accrualDate <= endDate &&
        (accrualDate > anchorDate || (includeAnchorDate && isSameDay(accrualDate, anchorDate)))
      ) {
        dates.push(accrualDate)
      }
    }

    cursor = addMonths(cursor, 1)
  }

  return dates.sort((left, right) => left.getTime() - right.getTime())
}

function getSemimonthlyDatesForMonth(monthDate: Date, terms: AccrualTerms) {
  if (terms.semimonthlyMode === 'dayOfWeek') {
    return [
      getNthWeekdayOfMonth(monthDate, terms.semimonthlyWeekday, 1),
      getNthWeekdayOfMonth(monthDate, terms.semimonthlyWeekday, 3)
    ]
  }

  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const lastDay = endOfMonth(monthDate).getDate()
  const firstDay = Math.min(terms.semimonthlyFirstDay, lastDay)
  const secondDay = Math.min(terms.semimonthlySecondDay, lastDay)

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
    (!Array.isArray(value.accrualAdjustments) || value.accrualAdjustments.length === 0) &&
    (!Array.isArray(value.balanceAdjustments) || value.balanceAdjustments.length === 0) &&
    Object.keys(value.scheduledPto ?? {}).length === 0

  if (shouldClearLegacyDefaults) {
    return { ...defaultSettings }
  }

  const normalizedTerms = {
    accrualAmount: normalizeOptionalNumber(value.accrualAmount),
    accrualFrequency: normalizeAccrualFrequency(value.accrualFrequency),
    semimonthlyFirstDay: normalizeDayOfMonth(value.semimonthlyFirstDay, defaultSettings.semimonthlyFirstDay),
    semimonthlyMode: normalizeSemimonthlyMode(value.semimonthlyMode),
    semimonthlySecondDay: normalizeDayOfMonth(value.semimonthlySecondDay, defaultSettings.semimonthlySecondDay),
    semimonthlyWeekday: normalizeWeekday(value.semimonthlyWeekday, defaultSettings.semimonthlyWeekday)
  }
  const normalized = {
    ...normalizedTerms,
    accrualAdjustments: normalizeAccrualAdjustments(value.accrualAdjustments),
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

async function saveSettingsNow(value = settings.value) {
  await nextTick()

  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer)
    remoteSaveTimer = null
  }

  return saveRemoteSettings(value)
}

async function saveRemoteSettings(value: PtoSettings) {
  const saveToastVersion = showSaving()

  try {
    const response = await $fetch<{ settings: PtoSettings }>('/api/pto-settings', {
      method: 'PUT',
      body: {
        settings: value
      }
    })
    showSaved(saveToastVersion)
    return response.settings
  } catch (error) {
    console.warn('[pto-settings] Unable to save settings to database:', error)
    showSaveError(saveToastVersion)
    return null
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

function normalizeOptionalDayOfMonth(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  return Math.min(31, Math.max(1, Math.trunc(numberValue)))
}

function normalizeOptionalWeekday(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
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

function normalizeBalanceAdjustments(value: BalanceAdjustment[] | undefined) {
  if (!Array.isArray(value)) return []

  return value
    .filter((adjustment) => adjustment.date)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((adjustment) => ({
      id: adjustment.id || createId(),
      date: adjustment.date,
      balance: normalizeAdjustmentBalance(adjustment) ?? 0,
      note: adjustment.note || ''
    }))
}

function normalizeAccrualAdjustments(value: AccrualAdjustment[] | undefined) {
  if (!Array.isArray(value)) return []

  return value
    .filter((adjustment) => adjustment.date)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((adjustment) => ({
      id: adjustment.id || createId(),
      date: adjustment.date,
      note: adjustment.note || '',
      ...normalizeAdjustmentTerms(adjustment)
    }))
    .filter(hasAccrualOverride)
}

function normalizeAdjustmentBalance(adjustment: BalanceAdjustment | (Partial<BalanceAdjustment> & { hours?: number })) {
  const balance = 'balance' in adjustment ? adjustment.balance : adjustment.hours
  if (balance === null || balance === undefined || balance === '') return null

  const numericBalance = Number(balance)
  return Number.isFinite(numericBalance) ? numericBalance : null
}

function normalizeAdjustmentTerms(value: Partial<AccrualAdjustment>): Omit<AccrualAdjustment, 'id' | 'date' | 'note'> {
  return {
    accrualAmount: normalizeOptionalNumber(value.accrualAmount),
    accrualFrequency: normalizeAccrualFrequency(value.accrualFrequency),
    semimonthlyFirstDay: normalizeOptionalDayOfMonth(value.semimonthlyFirstDay),
    semimonthlyMode: value.semimonthlyMode ? normalizeSemimonthlyMode(value.semimonthlyMode) : '',
    semimonthlySecondDay: normalizeOptionalDayOfMonth(value.semimonthlySecondDay),
    semimonthlyWeekday: normalizeOptionalWeekday(value.semimonthlyWeekday)
  }
}

function getInitialAccrualTerms(): AccrualTerms {
  return {
    accrualAmount: settings.value.accrualAmount,
    accrualFrequency: settings.value.accrualFrequency,
    semimonthlyFirstDay: settings.value.semimonthlyFirstDay,
    semimonthlyMode: settings.value.semimonthlyMode,
    semimonthlySecondDay: settings.value.semimonthlySecondDay,
    semimonthlyWeekday: settings.value.semimonthlyWeekday
  }
}

function applyAdjustmentTerms(terms: AccrualTerms, adjustment: AccrualAdjustment): AccrualTerms {
  return {
    accrualAmount: adjustment.accrualAmount ?? terms.accrualAmount,
    accrualFrequency: adjustment.accrualFrequency || terms.accrualFrequency,
    semimonthlyFirstDay: adjustment.semimonthlyFirstDay ?? terms.semimonthlyFirstDay,
    semimonthlyMode: adjustment.semimonthlyMode || terms.semimonthlyMode,
    semimonthlySecondDay: adjustment.semimonthlySecondDay ?? terms.semimonthlySecondDay,
    semimonthlyWeekday: adjustment.semimonthlyWeekday ?? terms.semimonthlyWeekday
  }
}

function hasCadenceOverride(adjustment: AccrualAdjustment) {
  return Boolean(adjustment.accrualFrequency) ||
    adjustment.semimonthlyFirstDay !== null ||
    Boolean(adjustment.semimonthlyMode) ||
    adjustment.semimonthlySecondDay !== null ||
    adjustment.semimonthlyWeekday !== null
}

function hasAccrualOverride(adjustment: AccrualAdjustment) {
  return adjustment.accrualAmount !== null || hasCadenceOverride(adjustment)
}

function getSortedAdjustments(): AdjustmentEvent[] {
  return [
    ...settings.value.balanceAdjustments.map((adjustment) => ({
      adjustment,
      date: adjustment.date,
      type: 'balance' as const
    })),
    ...settings.value.accrualAdjustments.map((adjustment) => ({
      adjustment,
      date: adjustment.date,
      type: 'accrual' as const
    }))
  ].sort((left, right) => {
    const dateComparison = left.date.localeCompare(right.date)
    if (dateComparison !== 0) return dateComparison
    if (left.type === right.type) return 0
    return left.type === 'accrual' ? -1 : 1
  })
}

function getSortedAccrualAdjustments() {
  return [...settings.value.accrualAdjustments].sort((left, right) => left.date.localeCompare(right.date))
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

function maxDate(left: Date, right: Date) {
  return left > right ? left : right
}

function minDate(left: Date, right: Date) {
  return left < right ? left : right
}

export function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
}

export function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
