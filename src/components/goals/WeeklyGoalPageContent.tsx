'use client'

import { WeeklyGoalForm } from '@/components/goals/WeeklyGoalForm'

export function WeeklyGoalPageContent() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Weekly Goal</h1>
        <p className="text-muted-foreground">
          Create a new weekly goal to track short-term tasks and objectives.
        </p>
      </div>
      <WeeklyGoalForm />
    </div>
  )
} 