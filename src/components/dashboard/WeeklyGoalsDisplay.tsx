'use client'

import { useEffect, useState } from 'react'
import { useWeek } from '@/contexts/WeekContext'
import { useAuth } from '@/contexts/AuthContext'
import { Goal, GoalStatus } from '@/types/goals'
import { subscribeToGoalsByTimeframe } from '@/services/goalService'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus, ListTodo } from 'lucide-react'
import Link from 'next/link'
import { getISOWeek } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

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

const getStatusVariant = (status: GoalStatus) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'default'
    case 'at_risk':
      return 'destructive'
    case 'not_started':
    default:
      return 'secondary'
  }
}

export function WeeklyGoalsDisplay() {
  const { currentWeek } = useWeek()
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.organizationId || !currentWeek) return

    setIsLoading(true)
    const currentWeekNumber = getISOWeek(new Date(currentWeek.startDate))
    const currentYear = new Date(currentWeek.startDate).getFullYear()
    
    console.log('Setting up subscription for:', {
      currentWeekNumber,
      currentYear,
      currentWeek,
      startDate: new Date(currentWeek.startDate),
      endDate: new Date(currentWeek.endDate)
    })
    
    // Set up real-time subscription
    const unsubscribe = subscribeToGoalsByTimeframe(
      'weekly',
      user.organizationId,
      (updatedGoals) => {
        console.log('Received updated goals:', updatedGoals)
        
        // Deduplicate goals using a Map
        const uniqueGoals = Array.from(
          new Map(updatedGoals.map(goal => [goal.id, goal])).values()
        )
        
        console.log('Unique goals:', uniqueGoals)
        
        // Ensure each goal has a status
        const goalsWithStatus = uniqueGoals.map(goal => ({
          ...goal,
          status: goal.status || 'not_started'
        }))
        
        setGoals(goalsWithStatus)
        setIsLoading(false)
      },
      currentWeekNumber,
      currentYear,
      new Date(currentWeek.startDate),
      new Date(currentWeek.endDate)
    )

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      unsubscribe()
    }
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
        <div>
          <h2 className="text-lg font-semibold">Sprint Tasks</h2>
          <p className="text-sm text-muted-foreground">Track experiments and validate hypotheses</p>
        </div>
        <Link href={`/dashboard/goals/weekly/create?week=${currentWeek.id}`}>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Sprint Task
          </Button>
        </Link>
      </div>

      {goals.length === 0 ? (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <ListTodo className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground">No sprint tasks for this week.</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new task to start experimenting and tracking progress.</p>
            </div>
            <Link href={`/dashboard/goals/weekly/create?week=${currentWeek.id}`}>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Sprint Task
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{goal.title}</h3>
                    {goal.hypothesis && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Hypothesis:</span> {goal.hypothesis}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusVariant(goal.status)}>{goal.status}</Badge>
                </div>

                {goal.metrics && goal.metrics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Metrics</p>
                    <div className="grid grid-cols-2 gap-4">
                      {goal.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{metric.name}</span>
                          <span className="text-sm font-medium">
                            {metric.current || 0}/{metric.target} {metric.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      {goal.assignees.map((assignee) => (
                        <Avatar key={assignee.userId} className="border-2 border-background w-6 h-6">
                          <AvatarImage src={assignee.photoURL} />
                          <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={goal.progress} className="w-24" />
                      <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/goals/weekly/${goal.id}`}>
                    <Button variant="ghost" size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 