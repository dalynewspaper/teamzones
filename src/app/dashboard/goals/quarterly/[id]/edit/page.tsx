'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QuarterlyGoalForm } from '@/components/goals'
import { Card } from '@/components/ui/card'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { getGoalById } from '@/services/goalService'
import { Goal } from '@/types/goals'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function EditQuarterlyGoalPage() {
  const router = useRouter()
  const params = useParams()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadGoal = async () => {
      if (!params?.id || typeof params.id !== 'string') return
      
      try {
        setIsLoading(true)
        const fetchedGoal = await getGoalById(params.id)
        if (!fetchedGoal) {
          router.push('/dashboard/goals')
          return
        }
        if (fetchedGoal.timeframe !== 'quarterly') {
          router.push('/dashboard/goals')
          return
        }
        setGoal(fetchedGoal)
      } catch (error) {
        console.error('Error loading goal:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGoal()
  }, [params?.id, router])

  if (isLoading) {
    return (
      <Dashboard>
        <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
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
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => router.push(`/dashboard/goals/quarterly/${goal.id}`)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Goal
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight">Edit Quarterly Goal</h1>
              <p className="text-sm text-muted-foreground">
                Update your quarterly goal, key results, and metrics.
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <QuarterlyGoalForm initialData={goal} mode="edit" />
          </div>
        </div>
      </div>
    </Dashboard>
  )
} 