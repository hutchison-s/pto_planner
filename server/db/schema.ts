import { relations, sql } from 'drizzle-orm'
import { boolean, date, integer, numeric, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import type { AccrualFrequency, SemimonthlyAccrualMode } from '../../app/composables/usePtoSettings'

export const ptoSettings = pgTable('pto_settings', {
  userId: text('user_id').primaryKey(),
  accrualAmount: numeric('accrual_amount', { precision: 8, scale: 2 }),
  accrualFrequency: text('accrual_frequency').$type<AccrualFrequency | ''>().notNull().default(''),
  initialSetupComplete: boolean('initial_setup_complete').notNull().default(false),
  paidHolidayIds: text('paid_holiday_ids').array().notNull().default(sql`ARRAY[]::text[]`),
  semimonthlyFirstDay: integer('semimonthly_first_day').notNull().default(1),
  semimonthlyMode: text('semimonthly_mode').$type<SemimonthlyAccrualMode>().notNull().default('daysOfMonth'),
  semimonthlySecondDay: integer('semimonthly_second_day').notNull().default(15),
  semimonthlyWeekday: integer('semimonthly_weekday').notNull().default(5),
  startingBalance: numeric('starting_balance', { precision: 8, scale: 2 }),
  startingDate: date('starting_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const balanceCorrections = pgTable('balance_corrections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => ptoSettings.userId, { onDelete: 'cascade' }),
  correctionDate: date('correction_date').notNull(),
  balance: numeric('balance', { precision: 8, scale: 2 }).notNull(),
  note: text('note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const accrualAdjustments = pgTable('accrual_adjustments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => ptoSettings.userId, { onDelete: 'cascade' }),
  adjustmentDate: date('adjustment_date').notNull(),
  accrualAmount: numeric('accrual_amount', { precision: 8, scale: 2 }),
  accrualFrequency: text('accrual_frequency').$type<AccrualFrequency | ''>(),
  note: text('note').notNull().default(''),
  semimonthlyFirstDay: integer('semimonthly_first_day'),
  semimonthlyMode: text('semimonthly_mode').$type<SemimonthlyAccrualMode>(),
  semimonthlySecondDay: integer('semimonthly_second_day'),
  semimonthlyWeekday: integer('semimonthly_weekday'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const scheduledPto = pgTable('scheduled_pto', {
  userId: text('user_id').notNull().references(() => ptoSettings.userId, { onDelete: 'cascade' }),
  ptoDate: date('pto_date').notNull(),
  hours: numeric('hours', { precision: 8, scale: 2 }).notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.ptoDate] })
}))

export const customPaidHolidays = pgTable('custom_paid_holidays', {
  userId: text('user_id').notNull().references(() => ptoSettings.userId, { onDelete: 'cascade' }),
  holidayDate: date('holiday_date').notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.holidayDate] })
}))

export const ptoSettingsRelations = relations(ptoSettings, ({ many }) => ({
  accrualAdjustments: many(accrualAdjustments),
  balanceCorrections: many(balanceCorrections),
  customPaidHolidays: many(customPaidHolidays),
  scheduledPto: many(scheduledPto)
}))

export const balanceCorrectionsRelations = relations(balanceCorrections, ({ one }) => ({
  settings: one(ptoSettings, {
    fields: [balanceCorrections.userId],
    references: [ptoSettings.userId]
  })
}))

export const accrualAdjustmentsRelations = relations(accrualAdjustments, ({ one }) => ({
  settings: one(ptoSettings, {
    fields: [accrualAdjustments.userId],
    references: [ptoSettings.userId]
  })
}))

export const scheduledPtoRelations = relations(scheduledPto, ({ one }) => ({
  settings: one(ptoSettings, {
    fields: [scheduledPto.userId],
    references: [ptoSettings.userId]
  })
}))

export const customPaidHolidaysRelations = relations(customPaidHolidays, ({ one }) => ({
  settings: one(ptoSettings, {
    fields: [customPaidHolidays.userId],
    references: [ptoSettings.userId]
  })
}))
