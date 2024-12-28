'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, getISOWeek } from 'date-fns'

interface Week {
  id: string
  startDate: Date
  endDate: Date
  weekNumber: number
  year: number
}

interface WeekContextType {
  currentWeek: Week | null
  navigateWeek: (direction: 'prev' | 'next') => void
  setWeekByDate: (date: Date) => void
  refreshWeek: () => void
}

const WeekContext = createContext<WeekContextType | undefined>(undefined)

function getWeekInfo(date: Date): Week {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Start week on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 })
  
  return {
    id: format(start, 'yyyy-\'W\'ww'),
    startDate: start,
    endDate: end,
    weekNumber: getISOWeek(date),
    year: date.getFullYear()
  }
}

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null)

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!currentWeek) return
    
    const newDate = direction === 'next' 
      ? addWeeks(currentWeek.startDate, 1)
      : subWeeks(currentWeek.startDate, 1)
    
    setCurrentWeek(getWeekInfo(newDate))
  }

  const setWeekByDate = (date: Date) => {
    setCurrentWeek(getWeekInfo(date))
  }

  const refreshWeek = () => {
    if (user) {
      setCurrentWeek(getWeekInfo(new Date()))
    }
  }

  useEffect(() => {
    refreshWeek()
  }, [user])

  return (
    <WeekContext.Provider value={{ currentWeek, navigateWeek, setWeekByDate, refreshWeek }}>
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