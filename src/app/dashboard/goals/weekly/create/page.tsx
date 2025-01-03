'use client'

import { WeeklyGoalForm } from '@/components/goals/WeeklyGoalForm'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function CreateWeeklyGoalPage() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Create Weekly Goal</h1>
                <p className="text-sm text-muted-foreground">
                  Create a new weekly goal for your team
                </p>
              </div>
            </div>
          </div>

          <WeeklyGoalForm mode="create" />
        </div>
      </div>
    </Dashboard>
  )
} 