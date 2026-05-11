import type { AccrualFrequency, SemimonthlyAccrualMode } from '~/composables/usePtoSettings'

export type AdjustmentDraft = {
  accrualAmount: number | null
  accrualFrequency: AccrualFrequency | ''
  accrualId: string | null
  balance: number | null
  balanceId: string | null
  date: string
  id: string
  note: string
  semimonthlyFirstDay: number | null
  semimonthlyMode: SemimonthlyAccrualMode | ''
  semimonthlySecondDay: number | null
  semimonthlyWeekday: number | null
}
