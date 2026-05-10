import type { CalendarDay, CalendarMonthData } from '~/types/calendar'

export type SummaryWeek = {
  key: string
  days: CalendarDay[]
  endBalance: number
}

export type SummaryMonthData = CalendarMonthData & {
  weeks: SummaryWeek[]
}
