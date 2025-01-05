'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Goal } from '@/types/goals'
import { subscribeToGoal } from '@/services/goalService'
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

export function ViewWeeklyGoalPageContent({ goalId }: ViewWeeklyGoalPageContentProps) {
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'activity'>('overview')

  useEffect(() => {
    const unsubscribe = subscribeToGoal(goalId, (updatedGoal) => {
      setGoal(updatedGoal)
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [goalId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 h-24" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-medium mb-2">Goal not found</h2>
          <p className="text-muted-foreground mb-4">This goal may have been deleted or you don't have access to it.</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    )
  }

  const progress = goal.progress || 0
  const progressColor = progress >= 100 ? 'bg-green-500' :
    progress >= 75 ? 'bg-blue-500' :
    progress >= 50 ? 'bg-yellow-500' :
    'bg-gray-500'

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM d, yyyy')
  }

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
              <span>{formatDate(goal.startDate)} - {formatDate(goal.endDate)}</span>
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
          </div>
        )}

        {activeTab === 'updates' && (
          <div>
            {/* Updates content */}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            {/* Activity content */}
          </div>
        )}
      </div>
    </div>
  )
} 