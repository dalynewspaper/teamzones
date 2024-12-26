import { startOfWeek, endOfWeek, format, parse } from 'date-fns'

export function getWeekDates(weekId: string) {
  const date = parse(weekId, 'yyyy-MM-dd', new Date())
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  
  return {
    start,
    end
  }
}

export function getCurrentWeekId(): string {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  return format(start, 'yyyy-MM-dd')
} 