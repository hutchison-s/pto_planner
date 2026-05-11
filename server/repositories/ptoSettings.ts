import { and, eq } from 'drizzle-orm'
import { defaultPaidHolidayIds } from '../../app/utils/holidays'
import type { AccrualAdjustment, BalanceAdjustment, PtoSettings } from '../../app/composables/usePtoSettings'
import { accrualAdjustments, balanceCorrections, customPaidHolidays, ptoSettings, scheduledPto } from '../db/schema'
import { getDb } from '../utils/db'

const fallbackSettings: PtoSettings = {
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

export async function getPtoSettingsForUser(userId: string) {
  const db = getDb()
  const [settingsRow] = await db.select().from(ptoSettings).where(eq(ptoSettings.userId, userId)).limit(1)
  if (!settingsRow) return null

  const [adjustmentRows, accrualRows, scheduledRows, holidayRows] = await Promise.all([
    db.select().from(balanceCorrections).where(eq(balanceCorrections.userId, userId)),
    db.select().from(accrualAdjustments).where(eq(accrualAdjustments.userId, userId)),
    db.select().from(scheduledPto).where(eq(scheduledPto.userId, userId)),
    db.select().from(customPaidHolidays).where(eq(customPaidHolidays.userId, userId))
  ])

  return normalizeSettingsPayload({
    accrualAmount: toNullableNumber(settingsRow.accrualAmount),
    accrualAdjustments: accrualRows.map((adjustment): AccrualAdjustment => ({
      accrualAmount: toNullableNumber(adjustment.accrualAmount),
      accrualFrequency: adjustment.accrualFrequency ?? '',
      id: adjustment.id,
      date: adjustment.adjustmentDate,
      note: adjustment.note,
      semimonthlyFirstDay: adjustment.semimonthlyFirstDay,
      semimonthlyMode: adjustment.semimonthlyMode ?? '',
      semimonthlySecondDay: adjustment.semimonthlySecondDay,
      semimonthlyWeekday: adjustment.semimonthlyWeekday
    })),
    accrualFrequency: settingsRow.accrualFrequency,
    balanceAdjustments: adjustmentRows.map((adjustment): BalanceAdjustment => ({
      id: adjustment.id,
      date: adjustment.correctionDate,
      balance: Number(adjustment.balance),
      note: adjustment.note
    })),
    customPaidHolidayDates: holidayRows.map((holiday) => holiday.holidayDate),
    initialSetupComplete: settingsRow.initialSetupComplete,
    paidHolidayIds: settingsRow.paidHolidayIds,
    semimonthlyFirstDay: settingsRow.semimonthlyFirstDay,
    semimonthlyMode: settingsRow.semimonthlyMode,
    semimonthlySecondDay: settingsRow.semimonthlySecondDay,
    semimonthlyWeekday: settingsRow.semimonthlyWeekday,
    startingBalance: toNullableNumber(settingsRow.startingBalance),
    startingDate: settingsRow.startingDate ?? '',
    scheduledPto: scheduledRows.reduce<Record<string, number>>((scheduled, row) => {
      scheduled[row.ptoDate] = Number(row.hours)
      return scheduled
    }, {})
  })
}

export async function savePtoSettingsForUser(userId: string, payload: PtoSettings) {
  const db = getDb()
  const normalized = normalizeSettingsPayload(payload)

  await db
    .insert(ptoSettings)
    .values({
      userId,
      accrualAmount: toNumericString(normalized.accrualAmount),
      accrualFrequency: normalized.accrualFrequency,
      initialSetupComplete: normalized.initialSetupComplete,
      paidHolidayIds: normalized.paidHolidayIds,
      semimonthlyFirstDay: normalized.semimonthlyFirstDay,
      semimonthlyMode: normalized.semimonthlyMode,
      semimonthlySecondDay: normalized.semimonthlySecondDay,
      semimonthlyWeekday: normalized.semimonthlyWeekday,
      startingBalance: toNumericString(normalized.startingBalance),
      startingDate: normalized.startingDate || null,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: ptoSettings.userId,
      set: {
        accrualAmount: toNumericString(normalized.accrualAmount),
        accrualFrequency: normalized.accrualFrequency,
        initialSetupComplete: normalized.initialSetupComplete,
        paidHolidayIds: normalized.paidHolidayIds,
        semimonthlyFirstDay: normalized.semimonthlyFirstDay,
        semimonthlyMode: normalized.semimonthlyMode,
        semimonthlySecondDay: normalized.semimonthlySecondDay,
        semimonthlyWeekday: normalized.semimonthlyWeekday,
        startingBalance: toNumericString(normalized.startingBalance),
        startingDate: normalized.startingDate || null,
        updatedAt: new Date()
      }
    })

  await Promise.all([
    db.delete(accrualAdjustments).where(eq(accrualAdjustments.userId, userId)),
    db.delete(balanceCorrections).where(eq(balanceCorrections.userId, userId)),
    db.delete(customPaidHolidays).where(eq(customPaidHolidays.userId, userId)),
    db.delete(scheduledPto).where(eq(scheduledPto.userId, userId))
  ])

  if (normalized.balanceAdjustments.length > 0) {
    await db.insert(balanceCorrections).values(normalized.balanceAdjustments.map((adjustment) => ({
      id: adjustment.id,
      userId,
      correctionDate: adjustment.date,
      balance: toNumericString(adjustment.balance),
      note: adjustment.note,
      updatedAt: new Date()
    })))
  }

  if (normalized.accrualAdjustments.length > 0) {
    await db.insert(accrualAdjustments).values(normalized.accrualAdjustments.map((adjustment) => ({
      id: adjustment.id,
      userId,
      adjustmentDate: adjustment.date,
      accrualAmount: toNumericString(adjustment.accrualAmount),
      accrualFrequency: adjustment.accrualFrequency,
      note: adjustment.note,
      semimonthlyFirstDay: adjustment.semimonthlyFirstDay,
      semimonthlyMode: adjustment.semimonthlyMode,
      semimonthlySecondDay: adjustment.semimonthlySecondDay,
      semimonthlyWeekday: adjustment.semimonthlyWeekday,
      updatedAt: new Date()
    })))
  }

  if (normalized.customPaidHolidayDates.length > 0) {
    await db.insert(customPaidHolidays).values(normalized.customPaidHolidayDates.map((dateKey) => ({
      userId,
      holidayDate: dateKey
    })))
  }

  const scheduledEntries = Object.entries(normalized.scheduledPto)
  if (scheduledEntries.length > 0) {
    await db.insert(scheduledPto).values(scheduledEntries.map(([dateKey, hours]) => ({
      userId,
      ptoDate: dateKey,
      hours: hours.toString()
    })))
  }

  return normalized
}

export async function resetPtoSettingsForUser(userId: string) {
  const db = getDb()
  await Promise.all([
    db.delete(accrualAdjustments).where(eq(accrualAdjustments.userId, userId)),
    db.delete(balanceCorrections).where(eq(balanceCorrections.userId, userId)),
    db.delete(customPaidHolidays).where(eq(customPaidHolidays.userId, userId)),
    db.delete(scheduledPto).where(eq(scheduledPto.userId, userId))
  ])

  await db.delete(ptoSettings).where(eq(ptoSettings.userId, userId))
}

export async function resetPlannedPtoForUser(userId: string) {
  const db = getDb()
  await db.delete(scheduledPto).where(eq(scheduledPto.userId, userId))
}

export async function resetBalanceCorrectionsForUser(userId: string) {
  const db = getDb()
  await db.delete(balanceCorrections).where(eq(balanceCorrections.userId, userId))
}

export async function setCustomPaidHolidayForUser(userId: string, dateKey: string, isPaidHoliday: boolean) {
  const db = getDb()
  if (!isPaidHoliday) {
    await db
      .delete(customPaidHolidays)
      .where(and(eq(customPaidHolidays.userId, userId), eq(customPaidHolidays.holidayDate, dateKey)))
    return
  }

  await db
    .insert(customPaidHolidays)
    .values({ userId, holidayDate: dateKey })
    .onConflictDoNothing()
}

function normalizeSettingsPayload(value: PtoSettings): PtoSettings {
  const terms = {
    accrualAmount: toNullableNumber(value.accrualAmount),
    accrualFrequency: normalizeAccrualFrequency(value.accrualFrequency),
    semimonthlyFirstDay: normalizeDayOfMonth(value.semimonthlyFirstDay, fallbackSettings.semimonthlyFirstDay),
    semimonthlyMode: normalizeSemimonthlyMode(value.semimonthlyMode),
    semimonthlySecondDay: normalizeDayOfMonth(value.semimonthlySecondDay, fallbackSettings.semimonthlySecondDay),
    semimonthlyWeekday: normalizeWeekday(value.semimonthlyWeekday, fallbackSettings.semimonthlyWeekday)
  }

  return {
    ...fallbackSettings,
    ...value,
    ...terms,
    accrualAdjustments: normalizeAccrualAdjustments(value.accrualAdjustments),
    balanceAdjustments: normalizeBalanceAdjustments(value.balanceAdjustments),
    customPaidHolidayDates: normalizeDateKeys(value.customPaidHolidayDates),
    paidHolidayIds: Array.isArray(value.paidHolidayIds) ? value.paidHolidayIds : [...defaultPaidHolidayIds],
    scheduledPto: normalizeScheduledPto(value.scheduledPto),
    startingBalance: toNullableNumber(value.startingBalance),
    startingDate: value.startingDate || ''
  }
}

function normalizeBalanceAdjustments(value: PtoSettings['balanceAdjustments']) {
  if (!Array.isArray(value)) return []

  return value
    .filter((adjustment) => isDateKey(adjustment.date))
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((adjustment) => ({
      id: adjustment.id || crypto.randomUUID(),
      date: adjustment.date,
      balance: toNullableNumber(adjustment.balance),
      note: adjustment.note || ''
    }))
    .filter((adjustment): adjustment is BalanceAdjustment => adjustment.balance !== null)
}

function normalizeAccrualAdjustments(value: PtoSettings['accrualAdjustments']) {
  if (!Array.isArray(value)) return []

  return value
    .filter((adjustment) => isDateKey(adjustment.date))
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((adjustment) => ({
      id: adjustment.id || crypto.randomUUID(),
      date: adjustment.date,
      note: adjustment.note || '',
      accrualAmount: toNullableNumber(adjustment.accrualAmount),
      accrualFrequency: normalizeAccrualFrequency(adjustment.accrualFrequency),
      semimonthlyFirstDay: normalizeOptionalDayOfMonth(adjustment.semimonthlyFirstDay),
      semimonthlyMode: adjustment.semimonthlyMode ? normalizeSemimonthlyMode(adjustment.semimonthlyMode) : '',
      semimonthlySecondDay: normalizeOptionalDayOfMonth(adjustment.semimonthlySecondDay),
      semimonthlyWeekday: normalizeOptionalWeekday(adjustment.semimonthlyWeekday)
    }))
    .filter(hasAccrualOverride)
}

function normalizeScheduledPto(value: PtoSettings['scheduledPto']) {
  return Object.entries(value ?? {}).reduce<Record<string, number>>((scheduled, [dateKey, hours]) => {
    if (!isDateKey(dateKey)) return scheduled

    const numericHours = Number(hours)
    if (Number.isFinite(numericHours) && numericHours > 0) {
      scheduled[dateKey] = numericHours
    }

    return scheduled
  }, {})
}

function hasAccrualOverride(adjustment: AccrualAdjustment) {
  return adjustment.accrualAmount !== null ||
    Boolean(adjustment.accrualFrequency) ||
    adjustment.semimonthlyFirstDay !== null ||
    Boolean(adjustment.semimonthlyMode) ||
    adjustment.semimonthlySecondDay !== null ||
    adjustment.semimonthlyWeekday !== null
}

function normalizeDateKeys(value: string[]) {
  if (!Array.isArray(value)) return []
  return value.filter(isDateKey)
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function toNumericString(value: number | null) {
  return value === null ? null : value.toString()
}

function normalizeAccrualFrequency(value: unknown): PtoSettings['accrualFrequency'] {
  if (value === 'weekly' || value === 'biweekly' || value === 'semimonthly' || value === 'monthly') {
    return value
  }

  return ''
}

function normalizeSemimonthlyMode(value: unknown): PtoSettings['semimonthlyMode'] {
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
