'use client'

import { useRouter } from 'next/navigation'
import { AnnualGoalForm } from '@/components/goals'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewAnnualGoalPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/dashboard/goals')
  }

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => router.push('/dashboard/goals')}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Goals
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight">Create Annual Goal</h1>
              <p className="text-sm text-muted-foreground">
                Set your organization's annual objectives and key results.
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <AnnualGoalForm mode="create" onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </Dashboard>
  )
} 