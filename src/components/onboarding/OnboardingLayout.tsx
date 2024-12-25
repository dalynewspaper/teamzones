'use client'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { TeamSetup } from './steps/TeamSetup'
import { FirstUpdate } from './steps/FirstUpdate'

const steps = [
  { id: 'team', title: 'Team Setup' },
  { id: 'first-update', title: 'First Update' }
]

export function OnboardingLayout() {
  const { currentStep } = useOnboarding()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Progress */}
        <nav aria-label="Progress">
          <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
            {steps.map((step) => (
              <li key={step.id} className="md:flex-1">
                <div className={`
                  flex flex-col border-l-4 md:border-l-0 md:border-t-4 py-2 pl-4 md:pl-0 md:pt-4 md:pb-0
                  ${step.id === currentStep ? 'border-blue-600' : 'border-gray-200'}
                `}>
                  <span className={`
                    text-sm font-medium
                    ${step.id === currentStep ? 'text-blue-600' : 'text-gray-500'}
                  `}>
                    STEP {steps.findIndex(s => s.id === step.id) + 1}
                  </span>
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <div className="mt-10 bg-white shadow rounded-lg p-6">
          {currentStep === 'team' && <TeamSetup />}
          {currentStep === 'first-update' && <FirstUpdate />}
        </div>
      </div>
    </div>
  )
} 