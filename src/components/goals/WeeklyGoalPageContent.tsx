'use client'

import { WeeklyGoalForm } from '@/components/goals/WeeklyGoalForm'

export function WeeklyGoalPageContent() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Task</h1>
        <p className="text-muted-foreground">
          Create a new task to track short-term objectives.
        </p>
      </div>
      <WeeklyGoalForm mode="create" />
    </div>
  )
} 