'use client'

import { AnnualGoalForm } from '@/components/goals'
import { Card } from '@/components/ui/card'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function NewGoalPage() {
  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Create Annual Goal</h1>
            <p className="text-sm text-gray-500 mt-1">Set a new annual goal for fiscal year 2025</p>
          </div>

          <Card className="p-6">
            <AnnualGoalForm />
          </Card>
        </div>
      </div>
    </Dashboard>
  )
} 