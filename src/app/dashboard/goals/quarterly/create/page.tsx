'use client'

import { QuarterlyGoalForm } from '@/components/goals/QuarterlyGoalForm'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function CreateQuarterlyGoalPage() {
  return (
    <Dashboard>
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Quarterly Goal</h1>
          <p className="text-muted-foreground">
            Create a new quarterly goal to track medium-term objectives and initiatives.
          </p>
        </div>
        <QuarterlyGoalForm />
      </div>
    </Dashboard>
  )
} 