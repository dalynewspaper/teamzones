'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { startOfWeek, endOfWeek, format } from 'date-fns'

interface Week {
  id: string
  startDate: Date
  endDate: Date
}

interface WeekContextType {
  currentWeek: Week | null
  refreshWeek: () => void
}

const WeekContext = createContext<WeekContextType | undefined>(undefined)

function getCurrentWeek(): Week {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 }) // Start week on Monday
  const end = endOfWeek(now, { weekStartsOn: 1 })
  
  return {
    id: format(start, 'yyyy-MM-dd'),
    startDate: start,
    endDate: end
  }
}

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null)

  const refreshWeek = () => {
    if (user) {
      setCurrentWeek(getCurrentWeek())
    }
  }

  useEffect(() => {
    refreshWeek()
  }, [user])

  return (
    <WeekContext.Provider value={{ currentWeek, refreshWeek }}>
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