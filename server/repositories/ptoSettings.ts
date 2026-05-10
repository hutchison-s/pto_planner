import { and, eq } from 'drizzle-orm'
import { defaultPaidHolidayIds } from '../../app/utils/holidays'
import type { BalanceAdjustment, PtoSettings } from '../../app/composables/usePtoSettings'
import { balanceCorrections, customPaidHolidays, ptoSettings, scheduledPto } from '../db/schema'
import { getDb } from '../utils/db'

const fallbackSettings: PtoSettings = {
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

export async function getPtoSettingsForUser(userId: string) {
  const db = getDb()
  const [settingsRow] = await db.select().from(ptoSettings).where(eq(ptoSettings.userId, userId)).limit(1)
  if (!settingsRow) return null

  const [adjustmentRows, scheduledRows, holidayRows] = await Promise.all([
    db.select().from(balanceCorrections).where(eq(balanceCorrections.userId, userId)),
    db.select().from(scheduledPto).where(eq(scheduledPto.userId, userId)),
    db.select().from(customPaidHolidays).where(eq(customPaidHolidays.userId, userId))
  ])

  return normalizeSettingsPayload({
    accrualAmount: toNullableNumber(settingsRow.accrualAmount),
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
    db.delete(balanceCorrections).where(eq(balanceCorrections.userId, userId)),
    db.delete(customPaidHolidays).where(eq(customPaidHolidays.userId, userId)),
    db.delete(scheduledPto).where(eq(scheduledPto.userId, userId))
  ])

  if (normalized.balanceAdjustments.length > 0) {
    await db.insert(balanceCorrections).values(normalized.balanceAdjustments.map((adjustment) => ({
      id: adjustment.id,
      userId,
      correctionDate: adjustment.date,
      balance: adjustment.balance.toString(),
      note: adjustment.note,
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
  return {
    ...fallbackSettings,
    ...value,
    accrualAmount: toNullableNumber(value.accrualAmount),
    balanceAdjustments: Array.isArray(value.balanceAdjustments) ? value.balanceAdjustments : [],
    customPaidHolidayDates: normalizeDateKeys(value.customPaidHolidayDates),
    paidHolidayIds: Array.isArray(value.paidHolidayIds) ? value.paidHolidayIds : [...defaultPaidHolidayIds],
    scheduledPto: normalizeScheduledPto(value.scheduledPto),
    startingBalance: toNullableNumber(value.startingBalance),
    startingDate: value.startingDate || ''
  }
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
