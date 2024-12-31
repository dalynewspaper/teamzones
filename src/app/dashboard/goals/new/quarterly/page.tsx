'use client'

import { QuarterlyGoalForm } from '@/components/goals'
import { Card } from '@/components/ui/card'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewQuarterlyGoalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quarter = Number(searchParams.get('quarter')) as 1 | 2 | 3 | 4
  const year = Number(searchParams.get('year')) || new Date().getFullYear()
  const parentGoalId = searchParams.get('parentGoalId') || undefined

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push('/dashboard/goals')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Goals
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Create Quarterly Goal</h1>
            <p className="text-sm text-gray-500 mt-1">Set a new goal for Q{quarter} {year}</p>
          </div>

          <Card className="p-6">
            <QuarterlyGoalForm
              quarter={quarter}
              year={year}
              parentGoalId={parentGoalId}
            />
          </Card>
        </div>
      </div>
    </Dashboard>
  )
} 