'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { OnboardingProgress } from './OnboardingProgress'
import { TeamSetup } from './steps/TeamSetup'
import { FirstUpdate } from './steps/FirstUpdate'

const stepComponents = {
  'team': TeamSetup,
  'first-update': FirstUpdate
}

export function OnboardingModal() {
  const router = useRouter()
  const { state, skipOnboarding } = useOnboarding()
  const { currentStep, isComplete } = state

  useEffect(() => {
    if (isComplete) {
      router.push('/dashboard')
    }
  }, [isComplete, router])

  if (!state.shouldShow) {
    return null
  }

  const isOptionalStep = state.currentStep === 'first-update'

  return (
    <Sheet open={state.shouldShow} onOpenChange={() => {}}>
      <SheetContent className="w-full max-w-xl">
        <SheetHeader>
          <SheetTitle>Welcome to TeamZones</SheetTitle>
        </SheetHeader>

        <OnboardingProgress />

        <div className="mt-6">
          {state.currentStep === 'team' && <TeamSetup />}
          {state.currentStep === 'first-update' && <FirstUpdate />}
        </div>

        {isOptionalStep && (
          <div className="mt-6 text-center">
            <button
              onClick={skipOnboarding}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
} 