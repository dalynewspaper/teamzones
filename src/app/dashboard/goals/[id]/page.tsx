'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Target, Calendar, Users, BarChart3, Flag } from 'lucide-react'
import { Goal, GoalMetric } from '@/types/goals'
import { getGoalById, deleteGoal, updateGoalProgress, updateGoalMetrics, updateKeyResultMetric } from '@/services/goalService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'

function MetricCard({ metric }: { metric: GoalMetric }) {
  const progress = (metric.current / metric.target) * 100
  const color = progress >= 100 ? 'text-green-600' : progress >= 70 ? 'text-blue-600' : 'text-yellow-600'

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-2">{metric.name}</h3>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-gray-500">Current Value</div>
          <div className={`text-lg font-medium ${color}`}>
            {metric.current} {metric.unit}
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-sm text-gray-500">Target</div>
          <div className="text-lg font-medium">
            {metric.target} {metric.unit}
          </div>
        </div>
      </div>
      <div className="mt-3 bg-gray-100 rounded-full h-2">
        <div
          className={`h-full rounded-full ${
            progress >= 100 ? 'bg-green-500' : progress >= 70 ? 'bg-blue-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-500 text-right">
        {Math.round(progress)}% Complete
      </div>
    </Card>
  )
}

export default function GoalDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showProgressUpdate, setShowProgressUpdate] = useState(false)
  const [newProgress, setNewProgress] = useState<number>(0)

  useEffect(() => {
    const loadGoal = async () => {
      if (!user?.organizationId || !params?.id || typeof params.id !== 'string') return
      
      try {
        setIsLoading(true)
        const fetchedGoal = await getGoalById(params.id)
        setGoal(fetchedGoal)
      } catch (error) {
        console.error('Error loading goal:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGoal()
  }, [params?.id, user?.organizationId])

  const handleDelete = async () => {
    if (!goal || !window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) return

    try {
      setIsUpdating(true)
      await deleteGoal(goal.id)
      toast({
        title: 'Goal deleted',
        description: 'The goal has been successfully deleted.'
      })
      router.push('/dashboard/goals')
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete goal. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleProgressUpdate = async () => {
    if (!goal) return

    try {
      setIsUpdating(true)
      await updateGoalProgress(goal.id, newProgress)
      setGoal(prev => prev ? { ...prev, progress: newProgress } : null)
      setShowProgressUpdate(false)
      toast({
        title: 'Progress updated',
        description: 'Goal progress has been successfully updated.'
      })
    } catch (error) {
      console.error('Error updating progress:', error)
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMetricUpdate = async (metricId: string, updates: Partial<GoalMetric>) => {
    if (!goal) return

    try {
      setIsUpdating(true)
      await updateGoalMetrics(goal.id, metricId, updates)
      // Refresh goal data
      const updatedGoal = await getGoalById(goal.id)
      setGoal(updatedGoal)
      toast({
        title: 'Metric updated',
        description: 'The metric has been successfully updated.'
      })
    } catch (error) {
      console.error('Error updating metric:', error)
      toast({
        title: 'Error',
        description: 'Failed to update metric. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Dashboard>
        <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Dashboard>
    )
  }

  if (!goal) {
    return (
      <Dashboard>
        <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Goal not found</h2>
            <p className="mt-2 text-gray-600">The goal you're looking for doesn't exist or you don't have access to it.</p>
            <Button
              onClick={() => router.push('/dashboard/goals')}
              className="mt-4"
            >
              Back to Goals
            </Button>
          </div>
        </div>
      </Dashboard>
    )
  }

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push('/dashboard/goals')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Goals
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{goal.title}</h1>
                <p className="mt-2 text-gray-600">{goal.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/goals/${goal.id}/edit`)}
                  disabled={isUpdating}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={isUpdating}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2" />
                {goal.type} Goal
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {goal.assignees.length} Assignees
              </div>
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                {goal.metrics?.length || 0} Metrics
              </div>
              <div className="flex items-center">
                <Flag className={`h-4 w-4 mr-2 ${
                  goal.priority === 'high' ? 'text-red-500' : 
                  goal.priority === 'medium' ? 'text-yellow-500' : 
                  'text-gray-500'
                }`} />
                {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
              </div>
            </div>

            {/* Progress Update Section */}
            <Card className="mt-4 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Overall Progress</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-64 h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${goal.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{goal.progress || 0}%</span>
                  </div>
                </div>
                {showProgressUpdate ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newProgress}
                      onChange={(e) => setNewProgress(Number(e.target.value))}
                      className="w-20"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleProgressUpdate}
                      disabled={isUpdating}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProgressUpdate(false)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewProgress(goal.progress || 0)
                      setShowProgressUpdate(true)
                    }}
                    disabled={isUpdating}
                  >
                    Update Progress
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Key Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Key Results</h2>
              <div className="text-sm text-gray-500">
                {goal.keyResults?.length || 0} Key Results
              </div>
            </div>
            <div className="space-y-6">
              {goal.keyResults?.map((kr, index) => (
                <Card key={kr.id} className="overflow-hidden">
                  <div className="border-l-4 border-blue-500 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-blue-600">Key Result {index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            Due: {new Date(kr.targetDate).toLocaleDateString()}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{kr.description}</h3>
                      </div>
                    </div>

                    {/* Metrics for this Key Result */}
                    {kr.metrics && kr.metrics.length > 0 ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Success Metrics</h4>
                          <span className="text-xs text-gray-500">{kr.metrics.length} metrics</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {kr.metrics.map((metric) => (
                            <div key={metric.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">{metric.name}</h5>
                                <span className="text-xs text-gray-500">{metric.frequency}</span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-gray-500">Current</div>
                                <div className="text-sm font-medium">
                                  {metric.current} {metric.unit}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-gray-500">Target</div>
                                <div className="text-sm font-medium">
                                  {metric.target} {metric.unit}
                                </div>
                              </div>
                              <div className="relative pt-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        (metric.current / metric.target) * 100 >= 100
                                          ? 'bg-green-500'
                                          : (metric.current / metric.target) * 100 >= 70
                                          ? 'bg-blue-500'
                                          : 'bg-yellow-500'
                                      }`}
                                      style={{ width: `${Math.min((metric.current / metric.target) * 100, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-600 ml-2">
                                    {Math.round((metric.current / metric.target) * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-gray-500 italic">
                        No metrics defined for this key result
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {(!goal.keyResults || goal.keyResults.length === 0) && (
                <Card className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">No key results defined for this goal.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Overall Goal Metrics */}
          {goal.metrics && goal.metrics.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Goal Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goal.metrics.map((metric) => (
                  <MetricCard key={metric.id} metric={metric} />
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Milestones</h2>
              <div className="space-y-2">
                {goal.milestones.map((milestone, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{milestone.title}</h3>
                        <p className="text-sm text-gray-500">{milestone.description}</p>
                      </div>
                      <Badge variant={milestone.status === 'completed' ? 'secondary' : 'default'}>
                        {milestone.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  )
} 