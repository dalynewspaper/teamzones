'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useWeek } from '@/contexts/WeekContext'
import { RecordingModal } from '@/components/dashboard/RecordingModal'

export function FirstUpdate() {
  const { completeStep } = useOnboarding()
  const { weekId } = useWeek()
  const [showRecorder, setShowRecorder] = useState(false)

  const handleComplete = () => {
    completeStep('first-update')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Record your first update</h3>
        <p className="text-sm text-gray-500">
          Share a quick video update with your team
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 p-6">
        <div className="text-center">
          <Button
            onClick={() => setShowRecorder(true)}
            className="w-full sm:w-auto"
          >
            Start Recording
          </Button>
        </div>
      </div>

      {showRecorder && (
        <RecordingModal 
          isOpen={showRecorder}
          onClose={() => setShowRecorder(false)}
          weekId={weekId}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
} 