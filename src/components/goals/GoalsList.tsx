'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Goal, GoalTimeframe } from '@/types/goals'
import { getGoalsByTimeframe } from '@/services/goalService'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, Flag, Target, Calendar, Users2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/utils/dateUtils'
import { useOrgSettings } from '@/hooks/useOrgSettings'
import { eventBus } from '@/lib/eventBus'

interface GoalsListProps {
  timeframe: GoalTimeframe
  onCreateClick: () => void
}

const emptyStateMessages = [
  {
    title: "Ready to Conquer Mountains? 🏔️",
    description: "Every great achievement starts with a goal. Let's map out your path to success!"
  },
  {
    title: "Dream Big, Plan Smart! 🚀",
    description: "Turn your vision into reality by setting clear, actionable goals."
  },
  {
    title: "The Journey Begins Here! 🌟",
    description: "Your team's success story is waiting to be written. Start with your first goal!"
  },
  {
    title: "Time to Make History! 📚",
    description: "Great teams set great goals. What amazing things will your team achieve?"
  },
  {
    title: "Adventure Awaits! 🗺️",
    description: "Every milestone starts with a single step. Ready to take yours?"
  }
]

export function GoalsList({ timeframe, onCreateClick }: GoalsListProps) {
  const { user } = useAuth()
  const { dateFormat } = useOrgSettings()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [emptyState] = useState(() => 
    emptyStateMessages[Math.floor(Math.random() * emptyStateMessages.length)]
  )

  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      if (!user?.organizationId) {
        if (isMounted) {
          setGoals([]);
          setIsLoading(false);
        }
        return;
      }
      
      try {
        setIsLoading(true);
        const fetchedGoals = await getGoalsByTimeframe(timeframe, user.organizationId);
        if (isMounted) {
          setGoals(fetchedGoals);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
        if (isMounted) {
          setGoals([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGoals();

    return () => {
      isMounted = false;
    };
  }, [timeframe, user?.organizationId])

  // Subscribe to goal events
  useEffect(() => {
    if (!user?.organizationId) return;

    const handleGoalCreated = (newGoal: Goal) => {
      if (newGoal.timeframe === timeframe) {
        setGoals(prevGoals => {
          // Check if goal already exists
          const exists = prevGoals.some(g => g.id === newGoal.id)
          if (exists) return prevGoals
          return [...prevGoals, newGoal]
        })
      }
    }

    const handleGoalUpdated = (updatedGoal: Goal) => {
      if (updatedGoal.timeframe === timeframe) {
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === updatedGoal.id ? updatedGoal : goal
          )
        )
      }
    }

    const handleGoalDeleted = (goalId: string) => {
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
  }, [timeframe, user?.organizationId])

  if (!user?.organizationId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{emptyState.title}</h3>
          <p className="text-muted-foreground mb-6">{emptyState.description}</p>
          <Button onClick={onCreateClick} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Create Your First Goal
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <Link key={goal.id} href={`/dashboard/goals/${timeframe}/${goal.id}`}>
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium">{goal.title}</h3>
                    <Badge variant={goal.status === 'completed' ? 'success' : goal.status === 'at_risk' ? 'destructive' : 'default'}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{goal.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(goal.endDate, dateFormat)}</span>
                  </div>
                  {goal.assignees && goal.assignees.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users2 className="h-4 w-4" />
                      <span>{goal.assignees.length} assignees</span>
                    </div>
                  )}
                  {goal.priority && (
                    <div className="flex items-center gap-1">
                      <Flag className="h-4 w-4" />
                      <span>{goal.priority}</span>
                    </div>
                  )}
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