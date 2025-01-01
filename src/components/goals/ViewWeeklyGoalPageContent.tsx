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
import { 
  CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Edit
} from 'lucide-react'

interface ViewWeeklyGoalPageContentProps {
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

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

const isFirestoreTimestamp = (value: any): value is FirestoreTimestamp => {
  return typeof value === 'object' && value !== null && 
    'seconds' in value && typeof value.seconds === 'number' &&
    'nanoseconds' in value && typeof value.nanoseconds === 'number';
};

const formatDate = (date: Date | FirestoreTimestamp | string | null | undefined) => {
  if (!date) return '';
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (isFirestoreTimestamp(date)) {
      dateObj = new Date(date.seconds * 1000);
    }
    // Handle string date
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date;
    }
    else {
      console.error('Unhandled date format:', date);
      return '';
    }

    // Validate the date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.error('Invalid date value:', date);
      return '';
    }

    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return '';
  }
};

export function ViewWeeklyGoalPageContent({ goalId }: ViewWeeklyGoalPageContentProps) {
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{goal.title}</h1>
            <Badge variant="secondary" className="capitalize">{goal.type}</Badge>
            <Badge variant="outline" className="capitalize">{goal.priority} Priority</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {format(new Date(goal.startDate), 'MMM d')} - {format(new Date(goal.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
                {statusIcons[goal.status]}
                <span className="ml-1 capitalize">{goal.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/goals/weekly/${goal.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
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
              {goal.milestones.map((milestone, index) => {
                console.log('Milestone data:', milestone, 'Due date:', milestone.dueDate);
                return (
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
                        Due: {formatDate(milestone.dueDate)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 