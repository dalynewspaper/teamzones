'use client'

import { MonthlyGoalForm } from '@/components/goals/MonthlyGoalForm'

export function MonthlyGoalPageContent() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Monthly Goal</h1>
        <p className="text-muted-foreground">
          Create a new monthly goal to track operational and action-oriented tasks.
        </p>
      </div>
      <MonthlyGoalForm />
    </div>
  )
} 