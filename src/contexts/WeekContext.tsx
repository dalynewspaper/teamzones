'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { Week } from '@/types/firestore'
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface WeekContextType {
  weekId: string
  setWeekId: (id: string) => void
  currentWeek: Week | null
  loading: boolean
  error: Error | null
  weekNumber: number
  weekYear: number
  weekStart: Date
  weekEnd: Date
  refreshWeek: () => Promise<void>
}

const WeekContext = createContext<WeekContextType | undefined>(undefined)

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const [weekId, setWeekId] = useState(() => {
    const today = new Date()
    const weekNumber = format(today, 'I')
    const year = format(today, 'yyyy')
    return `${year}-W${weekNumber.padStart(2, '0')}`
  })
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchWeek() {
      try {
        setLoading(true)
        setError(null)

        // Parse weekId to get dates
        const [year, week] = weekId.split('-W')
        const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
        const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        const end = endOfWeek(date, { weekStartsOn: 1 }) // Sunday

        // Query Firestore
        const weeksRef = collection(db, 'weeks')
        const q = query(
          weeksRef,
          where('startDate', '>=', start.toISOString()),
          where('startDate', '<=', end.toISOString()),
          orderBy('startDate', 'desc'),
        )

        const snapshot = await getDocs(q)
        
        if (snapshot.empty) {
          // Create new week if it doesn't exist
          const newWeek: Omit<Week, 'id'> = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            status: 'active',
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          // Add week to Firestore
          const docRef = await addDoc(collection(db, 'weeks'), newWeek)
          setCurrentWeek({ ...newWeek, id: docRef.id })
        } else {
          const weekData = snapshot.docs[0].data() as Omit<Week, 'id'>
          setCurrentWeek({ ...weekData, id: snapshot.docs[0].id })
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch week'))
      } finally {
        setLoading(false)
      }
    }

    fetchWeek()
  }, [weekId])

  // Add these computed values
  const [year, week] = weekId.split('-W')
  const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

  const refreshWeek = async () => {
    const fetchWeek = async () => {
      try {
        setLoading(true)
        setError(null)

        // Parse weekId to get dates
        const [year, week] = weekId.split('-W')
        const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
        const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        const end = endOfWeek(date, { weekStartsOn: 1 }) // Sunday

        // Query Firestore
        const weeksRef = collection(db, 'weeks')
        const q = query(
          weeksRef,
          where('startDate', '>=', start.toISOString()),
          where('startDate', '<=', end.toISOString()),
          orderBy('startDate', 'desc'),
        )

        const snapshot = await getDocs(q)
        
        if (snapshot.empty) {
          // Create new week if it doesn't exist
          const newWeek: Omit<Week, 'id'> = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            status: 'active',
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          // Add week to Firestore
          const docRef = await addDoc(collection(db, 'weeks'), newWeek)
          setCurrentWeek({ ...newWeek, id: docRef.id })
        } else {
          const weekData = snapshot.docs[0].data() as Omit<Week, 'id'>
          setCurrentWeek({ ...weekData, id: snapshot.docs[0].id })
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch week'))
      } finally {
        setLoading(false)
      }
    }
    await fetchWeek()
  }

  return (
    <WeekContext.Provider value={{ 
      weekId, 
      setWeekId, 
      currentWeek, 
      loading, 
      error,
      weekNumber: parseInt(week),
      weekYear: parseInt(year),
      weekStart,
      weekEnd,
      refreshWeek
    }}>
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