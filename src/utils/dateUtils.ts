import { format, addMonths, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns'
import { Timestamp } from 'firebase/firestore'

interface QuarterInfo {
  startDate: Date
  endDate: Date
  months: Array<{
    label: string
    date: Date
  }>
}

interface AvailableQuarter {
  quarter: number
  year: number
  label: string
  range: string
}

export function getFiscalYearInfo() {
  const currentYear = 2025
  return {
    planningYear: currentYear,
    startDate: new Date(currentYear, 0, 1), // January 1st
    endDate: new Date(currentYear, 11, 31), // December 31st
  }
}

export function getQuarterInfo(quarter: number, year: number): QuarterInfo {
  // Calculate the start month of the quarter (0-based)
  const startMonth = (quarter - 1) * 3
  const startDate = new Date(year, startMonth, 1)
  const endDate = endOfQuarter(startDate)

  // Generate array of months in the quarter
  const months = []
  for (let i = 0; i < 3; i++) {
    const monthDate = addMonths(startDate, i)
    const monthEndDate = endOfMonth(monthDate)
    months.push({
      label: format(monthDate, 'MMMM'),
      date: monthEndDate
    })
  }

  return {
    startDate,
    endDate,
    months
  }
}

export function getQuarterRange(quarter: number, year: number): string {
  const { startDate, endDate } = getQuarterInfo(quarter, year)
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
}

export function getAvailableQuarters(): AvailableQuarter[] {
  const { planningYear } = getFiscalYearInfo()
  
  return [
    {
      quarter: 1,
      year: planningYear,
      label: `Q1 ${planningYear}`,
      range: getQuarterRange(1, planningYear)
    },
    {
      quarter: 2,
      year: planningYear,
      label: `Q2 ${planningYear}`,
      range: getQuarterRange(2, planningYear)
    },
    {
      quarter: 3,
      year: planningYear,
      label: `Q3 ${planningYear}`,
      range: getQuarterRange(3, planningYear)
    },
    {
      quarter: 4,
      year: planningYear,
      label: `Q4 ${planningYear}`,
      range: getQuarterRange(4, planningYear)
    }
  ]
}

export function getDateFromTimestamp(date: Date | Timestamp | any): Date {
  if (date instanceof Timestamp) {
    return date.toDate()
  }
  if (date?.seconds && date?.nanoseconds) {
    return new Timestamp(date.seconds, date.nanoseconds).toDate()
  }
  if (date instanceof Date) {
    return date
  }
  return new Date(date)
}

export function formatDate(date: Date | Timestamp | any, dateFormat: string = 'MM/dd/yyyy'): string {
  try {
    const dateObj = getDateFromTimestamp(date)
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date)
      return 'Invalid Date'
    }
    return format(dateObj, dateFormat)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
} 