'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { OnboardingProgress } from './OnboardingProgress'
import { TeamSetup } from './steps/TeamSetup'
import { FirstUpdate } from './steps/FirstUpdate'

export function OnboardingModal() {
  const router = useRouter()
  const { currentStep, isComplete, skipOnboarding } = useOnboarding()

  useEffect(() => {
    if (isComplete) {
      router.push('/dashboard')
    }
  }, [isComplete, router])

  return (
    <Sheet open={!isComplete} onOpenChange={() => {}}>
      <SheetContent className="w-full max-w-xl">
        <SheetHeader>
          <SheetTitle>Welcome to TeamZones</SheetTitle>
        </SheetHeader>

        <OnboardingProgress />

        <div className="mt-6">
          {currentStep === 'team' && <TeamSetup />}
          {currentStep === 'first-update' && <FirstUpdate />}
        </div>

        {currentStep === 'first-update' && (
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