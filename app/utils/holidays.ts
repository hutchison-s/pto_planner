export type HolidayDefinition = {
  id: string
  label: string
}

export const holidayDefinitions: HolidayDefinition[] = [
  { id: 'new-years-day', label: 'New Year\'s Day' },
  { id: 'martin-luther-king-jr-day', label: 'Martin Luther King Jr. Day' },
  { id: 'presidents-day', label: 'Presidents Day' },
  { id: 'memorial-day', label: 'Memorial Day' },
  { id: 'juneteenth', label: 'Juneteenth' },
  { id: 'independence-day', label: 'Independence Day' },
  { id: 'labor-day', label: 'Labor Day' },
  { id: 'indigenous-peoples-day', label: 'Indigenous Peoples Day' },
  { id: 'veterans-day', label: 'Veterans Day' },
  { id: 'thanksgiving', label: 'Thanksgiving' },
  { id: 'christmas-day', label: 'Christmas Day' }
]

export const defaultPaidHolidayIds = holidayDefinitions.map((holiday) => holiday.id)

export function getHolidayForDate(date: Date) {
  const month = date.getMonth()
  const day = date.getDate()

  if (month === 0 && day === 1) return holidayDefinitions[0]
  if (month === 0 && isNthWeekday(date, 1, 3)) return holidayDefinitions[1]
  if (month === 1 && isNthWeekday(date, 1, 3)) return holidayDefinitions[2]
  if (month === 4 && isLastWeekday(date, 1)) return holidayDefinitions[3]
  if (month === 5 && day === 19) return holidayDefinitions[4]
  if (month === 6 && day === 4) return holidayDefinitions[5]
  if (month === 8 && isNthWeekday(date, 1, 1)) return holidayDefinitions[6]
  if (month === 9 && isNthWeekday(date, 1, 2)) return holidayDefinitions[7]
  if (month === 10 && day === 11) return holidayDefinitions[8]
  if (month === 10 && isNthWeekday(date, 4, 4)) return holidayDefinitions[9]
  if (month === 11 && day === 25) return holidayDefinitions[10]

  return null
}

export function getHolidayLabel(date: Date) {
  return getHolidayForDate(date)?.label ?? ''
}

export function isPaidHoliday(date: Date, paidHolidayIds: string[], customPaidHolidayDates: string[] = []) {
  if (customPaidHolidayDates.includes(toDateKey(date))) return true

  const holiday = getHolidayForDate(date)
  return Boolean(holiday && paidHolidayIds.includes(holiday.id))
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isNthWeekday(date: Date, weekday: number, occurrence: number) {
  if (date.getDay() !== weekday) return false
  return Math.floor((date.getDate() - 1) / 7) + 1 === occurrence
}

function isLastWeekday(date: Date, weekday: number) {
  if (date.getDay() !== weekday) return false
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7).getMonth() !== date.getMonth()
}
