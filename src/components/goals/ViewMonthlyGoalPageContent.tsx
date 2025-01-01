'use client'

import { getGoalById } from '@/services/goalService'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Goal } from '@/types/goals'
import { Timestamp } from 'firebase/firestore'
import { 
  CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Edit
} from 'lucide-react'

interface ViewMonthlyGoalPageContentProps {
  goalId: string
}

const statusIcons = {
  not_started: <Circle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  at_risk: <AlertTriangle className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />
}

const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  at_risk: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
}

function getDateFromTimestamp(date: Date | Timestamp): Date {
  if (date instanceof Timestamp) {
    return date.toDate()
  }
  return date
}

export function ViewMonthlyGoalPageContent({ goalId }: ViewMonthlyGoalPageContentProps) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const fetchedGoal = await getGoalById(goalId)
        if (!fetchedGoal) {
          router.push('/404')
          return
        }
        setGoal(fetchedGoal)
      } catch (error) {
        console.error('Error loading goal:', error)
        router.push('/404')
      } finally {
        setIsLoading(false)
      }
    }

    loadGoal()
  }, [goalId, router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!goal) {
    return null
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{goal.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={statusColors[goal.status]}>
              <span className="mr-1">{statusIcons[goal.status]}</span>
              {goal.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {format(new Date(goal.startDate), 'MMMM yyyy')}
            </Badge>
            <Badge variant="outline">{goal.type.toUpperCase()}</Badge>
            <Badge variant="outline" className={
              goal.priority === 'high' ? 'bg-red-100 text-red-800' :
              goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }>
              {goal.priority.toUpperCase()} Priority
            </Badge>
          </div>
        </div>
        <Link href={`/dashboard/goals/monthly/${goalId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Goal
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{goal.description}</p>
        </Card>

        {goal.metrics.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Metrics</h2>
            <div className="grid gap-4">
              {goal.metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{metric.name}</h3>
                    <p className="text-sm text-gray-500">Measured {metric.frequency}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Current</div>
                      <div className="font-medium">
                        {metric.current} {metric.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Target</div>
                      <div className="font-medium">
                        {metric.target} {metric.unit}
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="text-sm text-gray-500 mb-1">Progress</div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (metric.current / metric.target) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {goal.milestones.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Milestones</h2>
            <div className="space-y-4">
              {goal.milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className={`mt-1 ${
                    milestone.status === 'completed' ? 'text-green-500' :
                    milestone.status === 'at_risk' ? 'text-yellow-500' :
                    'text-gray-400'
                  }`}>
                    {statusIcons[milestone.status]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      Due: {format(getDateFromTimestamp(milestone.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {goal.lastCheckin && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Last Check-in</h2>
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                {format(new Date(goal.lastCheckin.date), 'MMMM d, yyyy')}
              </div>
              <div>
                <h3 className="font-medium mb-2">Status Update</h3>
                <p className="text-gray-700">{goal.lastCheckin.status}</p>
              </div>
              {goal.lastCheckin.blockers && goal.lastCheckin.blockers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Blockers</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {goal.lastCheckin.blockers.map((blocker, index) => (
                      <li key={index}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
              {goal.lastCheckin.nextSteps && goal.lastCheckin.nextSteps.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Next Steps</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {goal.lastCheckin.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 