import { useState, useEffect } from 'react'
import { Goal, GoalTimeframe } from '@/types/goals'
import { getGoalsByTimeframe } from '@/services/goalService'
import { useAuth } from '@/contexts/AuthContext'

export function useGoals(timeframe: GoalTimeframe) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchGoals() {
      if (!user?.organizationId) return
      
      try {
        setLoading(true)
        const fetchedGoals = await getGoalsByTimeframe(timeframe, user.organizationId)
        setGoals(fetchedGoals)
      } catch (error) {
        console.error('Error fetching goals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [user?.organizationId, timeframe])

  return { goals, loading }
} 