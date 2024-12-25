'use client'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { CheckIcon } from 'lucide-react'

const steps = [
  {
    id: 'team',
    title: 'Setup Team'
  },
  {
    id: 'first-update',
    title: 'First Update',
    optional: true
  }
]

export function OnboardingProgress() {
  const { state } = useOnboarding()
  const { currentStep } = state

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    return {
      isCompleted: stepIndex < currentIndex,
      isCurrent: stepId === currentStep
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Setup Progress</span>
        <span className="text-gray-500">
          {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
          {currentStep === 'first-update' && ' (optional)'}
        </span>
      </div>

      <div className="flex gap-2">
        {steps.map((step) => {
          const { isCompleted, isCurrent } = getStepStatus(step.id)
          return (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded-full transition-colors ${
                isCompleted
                  ? 'bg-blue-600'
                  : isCurrent
                  ? 'bg-blue-200'
                  : 'bg-gray-100'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
} 