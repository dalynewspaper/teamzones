'use client'

import { MonthlyGoalForm } from '@/components/goals/MonthlyGoalForm'
import { getGoalById } from '@/services/goalService'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Goal } from '@/types/goals'

interface EditMonthlyGoalPageContentProps {
  goalId: string
}

export function EditMonthlyGoalPageContent({ goalId }: EditMonthlyGoalPageContentProps) {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Monthly Goal</h1>
        <p className="text-muted-foreground">
          Update your monthly goal details and progress.
        </p>
      </div>
      <MonthlyGoalForm 
        mode="edit"
        initialData={goal}
      />
    </div>
  )
} 