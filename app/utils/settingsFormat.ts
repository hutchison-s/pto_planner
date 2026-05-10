import type { AccrualFrequency } from '~/composables/usePtoSettings'

export function frequencyLabelFor(frequency: AccrualFrequency | '') {
  const labels: Record<AccrualFrequency, string> = {
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    semimonthly: 'Twice a month',
    monthly: 'Monthly'
  }

  return frequency ? labels[frequency] : 'Not set'
}
