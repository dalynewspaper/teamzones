import { addMonths, startOfQuarter, endOfQuarter, format } from 'date-fns'

export function getFiscalYearInfo() {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  // For planning purposes, we consider the fiscal year to be the next year
  // if we're in Q4 (months 9-11, Oct-Dec)
  const isInQ4 = currentMonth >= 9
  const planningYear = isInQ4 ? currentYear + 1 : currentYear
  
  return {
    year: planningYear,
    isInQ4
  }
}

export function getQuarterInfo(quarter: number, year: number) {
  // Calculate quarter dates
  const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1))
  const quarterEnd = endOfQuarter(quarterStart)

  // Generate monthly milestones for the quarter
  const months = Array.from({ length: 3 }, (_, i) => {
    const date = addMonths(quarterStart, i)
    return {
      label: format(date, 'MMMM'),
      date: endOfQuarter(date)
    }
  })

  return {
    startDate: quarterStart,
    endDate: quarterEnd,
    months
  }
}

export function getCurrentQuarter() {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  return Math.floor(currentMonth / 3) + 1
}

export function getQuarterLabel(quarter: number) {
  return `Q${quarter}`
}

export function getQuarterRange(quarter: number, year: number) {
  const { startDate, endDate } = getQuarterInfo(quarter, year)
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
}

interface QuarterOption {
  quarter: number
  year: number
  label: string
  range: string
}

export function getAvailableQuarters(): QuarterOption[] {
  const currentDate = new Date()
  const currentQuarter = getCurrentQuarter()
  const currentYear = currentDate.getFullYear()
  const quarters: QuarterOption[] = []

  // Start with current quarter
  let quarter = currentQuarter
  let year = currentYear

  // Generate 6 quarters (current + 5 future)
  for (let i = 0; i < 6; i++) {
    quarters.push({
      quarter,
      year,
      label: `Q${quarter} ${year}`,
      range: getQuarterRange(quarter, year)
    })

    // Move to next quarter
    quarter++
    if (quarter > 4) {
      quarter = 1
      year++
    }
  }

  return quarters
} 