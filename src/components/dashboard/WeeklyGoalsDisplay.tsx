'use client'

import { useEffect, useState } from 'react'
import { useWeek } from '@/contexts/WeekContext'
import { useAuth } from '@/contexts/AuthContext'
import { Goal, GoalStatus } from '@/types/goals'
import { getGoalsByTimeframe } from '@/services/goalService'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import { parseISO } from 'date-fns'
import { getISOWeek } from 'date-fns'

const statusIcons = {
  not_started: <Circle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  at_risk: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />
}

const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  at_risk: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

function isFirestoreTimestamp(value: any): value is FirestoreTimestamp {
  return value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value;
}

function parseDate(date: any): Date {
  if (date instanceof Date) {
    return date;
  }
  if (isFirestoreTimestamp(date)) {
    return new Date(date.seconds * 1000);
  }
  if (typeof date === 'string') {
    return parseISO(date);
  }
  console.error('Unknown date format:', date);
  return new Date(); // fallback to current date
}

export function WeeklyGoalsDisplay() {
  const { currentWeek } = useWeek()
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWeeklyGoals = async () => {
      if (!user?.organizationId || !currentWeek) return

      try {
        setIsLoading(true)
        const currentWeekNumber = getISOWeek(new Date(currentWeek.startDate))
        const currentYear = new Date(currentWeek.startDate).getFullYear()
        
        console.log('Fetching goals for:', {
          currentWeekNumber,
          currentYear,
          currentWeek,
          startDate: new Date(currentWeek.startDate),
          endDate: new Date(currentWeek.endDate)
        })
        
        const weeklyGoals = await getGoalsByTimeframe(
          'weekly', 
          user.organizationId,
          currentWeekNumber,
          currentYear,
          new Date(currentWeek.startDate),
          new Date(currentWeek.endDate)
        )
        
        console.log('Fetched weekly goals:', weeklyGoals)
        
        // Deduplicate goals using a Map
        const uniqueGoals = Array.from(
          new Map(weeklyGoals.map(goal => [goal.id, goal])).values()
        )
        
        console.log('Unique goals:', uniqueGoals)
        
        // Ensure each goal has a status
        const goalsWithStatus = uniqueGoals.map(goal => ({
          ...goal,
          status: goal.status || 'not_started'
        }))
        
        setGoals(goalsWithStatus)
      } catch (error) {
        console.error('Error loading weekly goals:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWeeklyGoals()
  }, [user?.organizationId, currentWeek])

  // Debug render
  console.log('Rendering WeeklyGoalsDisplay:', {
    currentWeek,
    goalsCount: goals.length,
    isLoading
  })

  if (!currentWeek) {
    console.log('No current week available')
    return null
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Weekly Goals</h2>
        <Link href={`/dashboard/goals/weekly/create?week=${currentWeek.id}`}>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </Link>
      </div>

      {goals.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No goals set for this week.</p>
          <Link href={`/dashboard/goals/weekly/create?week=${currentWeek.id}`}>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Set Weekly Goals
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Link key={goal.id} href={`/dashboard/goals/weekly/${goal.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{goal.title}</h3>
                        <Badge variant="secondary" className="capitalize">{goal.type}</Badge>
                        <Badge variant="outline" className="capitalize">{goal.priority} Priority</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
                      {statusIcons[goal.status]}
                      <span className="ml-1 capitalize">{goal.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {/* Milestones summary */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{goal.milestones.filter(m => m.status === 'completed').length}/{goal.milestones.length} tasks completed</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 