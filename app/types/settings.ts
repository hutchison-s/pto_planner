import type { BalanceAdjustment } from '~/composables/usePtoSettings'

export type AdjustmentDraft = Omit<BalanceAdjustment, 'id'>
