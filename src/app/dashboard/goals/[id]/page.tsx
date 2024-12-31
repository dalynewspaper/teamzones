'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Target, Calendar, Users, BarChart3 } from 'lucide-react'
import { Goal, GoalMetric } from '@/types/goals'
import { getGoalById } from '@/services/goalService'
import { useAuth } from '@/contexts/AuthContext'

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
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
              <Badge variant={goal.priority === 'high' ? 'destructive' : 'default'}>
                {goal.priority === 'high' ? 'High Priority' : 'Normal Priority'}
              </Badge>
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
                {goal.metrics.length} Metrics
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goal.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </div>

          {/* Key Results or Milestones */}
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