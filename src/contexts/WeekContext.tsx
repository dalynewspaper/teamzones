'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Week } from '@/types/firestore'
import { getWeekDates } from '@/lib/date'

interface WeekContextType {
  weekId: string
  setWeekId: (weekId: string) => void
  currentWeek: Week | null
  setCurrentWeek: (week: Week | null) => void
  isLoading: boolean
  error: Error | null
  refreshWeek: () => Promise<void>
  weekNumber: number
  weekYear: number
  weekStart: Date
  weekEnd: Date
}

const WeekContext = createContext<WeekContextType | undefined>(undefined)

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [weekId, setWeekId] = useState(getCurrentWeekId())

  const [year, week] = weekId.split('-W').map(Number)
  const { start: weekStart, end: weekEnd } = getWeekDates(weekId)

  const refreshWeek = async () => {
    try {
      setIsLoading(true)
      const docRef = doc(db, 'weeks', weekId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setCurrentWeek(docSnap.data() as Week)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh week'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadWeek = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const docRef = doc(db, 'weeks', weekId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setCurrentWeek(docSnap.data() as Week)
        } else {
          // Initialize new week
          const newWeek: Week = {
            id: weekId,
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
          }
          await setDoc(docRef, newWeek)
          setCurrentWeek(newWeek)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load week'))
      } finally {
        setIsLoading(false)
      }
    }

    loadWeek()
  }, [weekId])

  return (
    <WeekContext.Provider value={{
      weekId,
      setWeekId,
      currentWeek,
      setCurrentWeek,
      isLoading,
      error,
      refreshWeek,
      weekNumber: week,
      weekYear: year,
      weekStart,
      weekEnd
    }}>
      {children}
    </WeekContext.Provider>
  )
}

export function useWeek() {
  const context = useContext(WeekContext)
  if (!context) {
    throw new Error('useWeek must be used within a WeekProvider')
  }
  return context
}

function getCurrentWeekId(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
} 