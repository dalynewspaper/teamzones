'use client'
import { createContext, useContext, useState } from 'react'

type StepId = 'team' | 'first-update'

interface OnboardingContextType {
  currentStep: StepId
  isComplete: boolean
  completeStep: () => void
  skipOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<StepId>('team')
  const [isComplete, setIsComplete] = useState(false)

  const completeStep = () => {
    if (currentStep === 'team') {
      setCurrentStep('first-update')
    } else {
      setIsComplete(true)
    }
  }

  const skipOnboarding = () => {
    setIsComplete(true)
  }

  return (
    <OnboardingContext.Provider value={{ 
      currentStep, 
      isComplete,
      completeStep,
      skipOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
} 