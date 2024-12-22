'use client'
import { createContext, useContext, useState } from 'react'

interface WeekContextType {
  weekId: string
  setWeekId: (weekId: string) => void
  weekNumber: number
  weekYear: number
  weekStart: Date
  weekEnd: Date
}

const WeekContext = createContext<WeekContextType | undefined>(undefined)

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Get ISO week number and year
  const getWeekData = (date: Date) => {
    const target = new Date(date.valueOf())
    const dayNumber = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNumber + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
    const weekYear = date.getFullYear()

    // Calculate week start (Monday) and end (Sunday)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - dayNumber)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    return {
      weekNumber,
      weekYear,
      weekStart,
      weekEnd,
      weekId: `${weekYear}-W${weekNumber.toString().padStart(2, '0')}`
    }
  }

  const weekData = getWeekData(currentDate)

  const value = {
    weekId: weekData.weekId,
    setWeekId: (weekId: string) => {
      // Parse weekId (YYYY-WNN) and set the corresponding date
      const [year, week] = weekId.split('-W')
      const date = new Date(parseInt(year), 0, 1)
      date.setDate(date.getDate() + (parseInt(week) - 1) * 7)
      setCurrentDate(date)
    },
    weekNumber: weekData.weekNumber,
    weekYear: weekData.weekYear,
    weekStart: weekData.weekStart,
    weekEnd: weekData.weekEnd
  }

  return (
    <WeekContext.Provider value={value}>
      {children}
    </WeekContext.Provider>
  )
}

export function useWeek() {
  const context = useContext(WeekContext)
  if (context === undefined) {
    throw new Error('useWeek must be used within a WeekProvider')
  }
  return context
} 