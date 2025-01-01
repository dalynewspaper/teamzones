'use client'

import { AnnualGoalForm } from '@/components/goals/AnnualGoalForm'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function CreateAnnualGoalPage() {
  return (
    <Dashboard>
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Annual Goal</h1>
          <p className="text-muted-foreground">
            Create a new annual goal to track long-term strategic objectives.
          </p>
        </div>
        <AnnualGoalForm />
      </div>
    </Dashboard>
  )
} 