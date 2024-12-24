'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { Week } from '@/types/firestore'
import { getWeek } from '@/services/firestoreService'
import { getCurrentWeekId } from '@/lib/date'

interface WeekContextType {
  currentWeek: Week | null
  setCurrentWeek: (week: Week | null) => void
  isLoading: boolean
  error: Error | null
  weekId: string
  setWeekId: (weekId: string) => void
  refreshWeek: () => void
}

const WeekContext = createContext<WeekContextType | undefined>(undefined)

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [weekId, setWeekId] = useState(getCurrentWeekId())

  useEffect(() => {
    const loadWeek = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const week = await getWeek(weekId)
        setCurrentWeek(week)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load week'))
      } finally {
        setIsLoading(false)
      }
    }

    loadWeek()
  }, [weekId])

  const refreshWeek = async () => {
    if (!weekId) return
    setIsLoading(true)
    try {
      const week = await getWeek(weekId)
      setCurrentWeek(week)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <WeekContext.Provider 
      value={{ 
        currentWeek, 
        setCurrentWeek, 
        isLoading, 
        error,
        weekId,
        setWeekId,
        refreshWeek
      }}
    >
      {children}
    </WeekContext.Provider>
  )
}

// Export a single hook for accessing the week context
export function useWeek() {
  const context = useContext(WeekContext)
  if (context === undefined) {
    throw new Error('useWeek must be used within a WeekProvider')
  }
  return context
} 