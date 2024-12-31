'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnnualGoalForm } from '@/components/goals'
import { Card } from '@/components/ui/card'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { getGoalById } from '@/services/goalService'
import { Goal } from '@/types/goals'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function EditGoalPage() {
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
        setGoal(fetchedGoal)
      } catch (error) {
        console.error('Error loading goal:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGoal()
  }, [params?.id])

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
      <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push(`/dashboard/goals/${goal.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Goal
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Edit {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">Update your goal details and metrics</p>
            </div>
          </div>

          <Card className="p-6">
            <AnnualGoalForm initialData={goal} mode="edit" />
          </Card>
        </div>
      </div>
    </Dashboard>
  )
} 