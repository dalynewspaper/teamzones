'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWeek } from '@/contexts/WeekContext'
import { useRouter } from 'next/navigation'

export function FirstUpdate() {
  const { completeStep } = useOnboarding()
  const { user } = useAuth()
  const { currentWeek } = useWeek()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleStartRecording = () => {
    completeStep('first-update')
    router.push(`/dashboard?record=true`)
  }

  const handleSkip = () => {
    completeStep('first-update')
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Record Your First Update</h3>
          <p className="text-sm text-gray-500">
            Share your first async update with your team
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm">
            Recording an update is a great way to keep your team in sync. You can:
          </p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Share what you're working on</li>
            <li>Highlight key accomplishments</li>
            <li>Ask for feedback or help</li>
            <li>Keep everyone aligned on goals</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Button
          onClick={handleStartRecording}
          className="w-full"
        >
          Start Recording
        </Button>
        <button
          onClick={handleSkip}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
} 