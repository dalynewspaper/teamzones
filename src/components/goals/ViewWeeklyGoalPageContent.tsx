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
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'activity'>('overview')
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
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!goal) return null

  const progress = goal.progress || 0
  const progressColor = progress >= 75 ? 'bg-green-500' : 
                       progress >= 50 ? 'bg-blue-500' : 
                       progress >= 25 ? 'bg-yellow-500' : 
                       'bg-gray-500'

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{goal.title}</h1>
              <Badge variant="secondary" className="capitalize">{goal.type}</Badge>
            </div>
            <p className="text-muted-foreground">{goal.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              Back
            </Button>
            <Link href={`/dashboard/goals/weekly/${goal.id}/edit`}>
              <Button variant="default" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
            <div className="flex items-center gap-2">
              {statusIcons[goal.status]}
              <span className="font-semibold capitalize">
                {goal.status.replace('_', ' ')}
              </span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                goal.priority === 'high' ? 'bg-red-500' :
                goal.priority === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <span className="font-semibold capitalize">{goal.priority}</span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
            <div className="flex items-center gap-2 font-semibold">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(goal.startDate), 'MMM d')} - {format(new Date(goal.endDate), 'MMM d')}</span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${progressColor} transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'updates' ? 'border-primary text-primary' : 'border-transparent'
            }`}
          >
            Updates
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'activity' ? 'border-primary text-primary' : 'border-transparent'
            }`}
          >
            Activity
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid gap-6">
            {/* Metrics */}
            {goal.metrics && goal.metrics.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Metrics</h2>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
                <div className="grid gap-4">
                  {goal.metrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                      <div>
                        <h3 className="font-medium">{metric.name}</h3>
                        <p className="text-sm text-muted-foreground">Measured {metric.frequency}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Current</div>
                          <div className="font-medium">
                            {metric.current} {metric.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Target</div>
                          <div className="font-medium">
                            {metric.target} {metric.unit}
                          </div>
                        </div>
                        <div className="w-32">
                          <div className="text-sm text-muted-foreground mb-1">
                            {Math.round((metric.current / metric.target) * 100)}%
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
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

            {/* Milestones */}
            {goal.milestones && goal.milestones.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Milestones</h2>
                  <Button variant="outline" size="sm">Add Milestone</Button>
                </div>
                <div className="space-y-4">
                  {goal.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-lg">
                      <div className={`mt-1 ${
                        milestone.status === 'completed' ? 'text-green-500' :
                        milestone.status === 'at_risk' ? 'text-yellow-500' :
                        'text-gray-400'
                      }`}>
                        {statusIcons[milestone.status]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{milestone.title}</h3>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2">
                            Due {formatDate(milestone.dueDate)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Team & Assignees */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Team & Assignees</h2>
              <div className="grid gap-4">
                {goal.assignees && goal.assignees.map((assignee, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {assignee.userId.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{assignee.userId}</div>
                        <div className="text-sm text-muted-foreground capitalize">{assignee.role}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {formatDate(assignee.assignedAt)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'updates' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Progress Updates</h2>
              <Button>Add Update</Button>
            </div>
            <div className="text-center text-muted-foreground py-8">
              No updates yet. Add your first progress update.
            </div>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Activity Log</h2>
            </div>
            <div className="text-center text-muted-foreground py-8">
              No activity recorded yet.
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 