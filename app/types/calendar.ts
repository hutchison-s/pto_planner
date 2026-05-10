export type CalendarDay = {
  key: string
  date: Date
  dateKey: string
  dayNumber: number
  isCurrentMonth: boolean
  isDepletedBalance: boolean
  isToday: boolean
  isWeekend: boolean
  isAccrualDate: boolean
  isLowBalance: boolean
  isPaidHoliday: boolean
  scheduledHours: number
  holidayLabel: string
}

export type CalendarMonthData = {
  key: string
  label: string
  startBalance: number
  endBalance: number
  days: CalendarDay[]
}
