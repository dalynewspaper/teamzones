'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Goal, GoalTimeframe } from '@/types/goals'
import { getGoalsByTimeframe } from '@/services/goalService'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, Flag, Target, Calendar, Users2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/utils/dateUtils'
import { useOrgSettings } from '@/hooks/useOrgSettings'
import { eventBus } from '@/lib/eventBus'

interface GoalsListProps {
  timeframe: GoalTimeframe
  onCreateClick: () => void
}

export function GoalsList({ timeframe, onCreateClick }: GoalsListProps) {
  const { user } = useAuth()
  const { dateFormat } = useOrgSettings()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.organizationId) return
      
      try {
        setIsLoading(true)
        const fetchedGoals = await getGoalsByTimeframe(timeframe, user.organizationId)
        setGoals(fetchedGoals)
      } catch (error) {
        console.error('Error loading goals:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGoals()
  }, [timeframe, user?.organizationId])

  // Subscribe to goal events
  useEffect(() => {
    const handleGoalCreated = (newGoal: Goal) => {
      if (newGoal.timeframe === timeframe) {
        // Immediately update the state with the new goal
        setGoals(prevGoals => [...prevGoals, newGoal])
      }
    }

    const handleGoalUpdated = (updatedGoal: Goal) => {
      if (updatedGoal.timeframe === timeframe) {
        // Immediately update the state with the updated goal
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === updatedGoal.id ? updatedGoal : goal
          )
        )
      }
    }

    const handleGoalDeleted = (goalId: string) => {
      // Immediately update the state by removing the deleted goal
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId))
    }

    // Subscribe to events
    eventBus.on('goalCreated', handleGoalCreated)
    eventBus.on('goalUpdated', handleGoalUpdated)
    eventBus.on('goalDeleted', handleGoalDeleted)

    // Cleanup
    return () => {
      eventBus.off('goalCreated', handleGoalCreated)
      eventBus.off('goalUpdated', handleGoalUpdated)
      eventBus.off('goalDeleted', handleGoalDeleted)
    }
  }, [timeframe])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </Card>
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-medium mb-2">No goals found</h3>
        <p className="text-muted-foreground mb-6">Get started by creating your first goal</p>
        <Button onClick={onCreateClick}>
          Create {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Goal
        </Button>
      </Card>
    )
  }

  const getTotalMetricsCount = (goal: Goal) => {
    const topLevelMetrics = goal.metrics?.length || 0
    const keyResultMetrics = goal.keyResults?.reduce((total, kr) => total + (kr.metrics?.length || 0), 0) || 0
    return topLevelMetrics + keyResultMetrics
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <Link 
          key={goal.id} 
          href={`/dashboard/goals/${goal.timeframe}/${goal.id}`}
        >
          <Card className="p-6 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    <Badge variant="secondary" className="capitalize">{goal.type}</Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{goal.description}</p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(goal.startDate, dateFormat)} - {formatDate(goal.endDate, dateFormat)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flag className="h-4 w-4" />
                    <span className="capitalize">{goal.priority} Priority</span>
                  </div>
                  {goal.assignees?.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users2 className="h-4 w-4" />
                      <span>{goal.assignees.length} Assignees</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>{getTotalMetricsCount(goal)} Metrics</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={goal.progress || 0} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{goal.progress || 0}%</span>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
} 