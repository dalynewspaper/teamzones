'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile, updateUserProfile } from '@/services/userService'

type OnboardingStep = 'user-info' | 'organization' | 'first-update'

interface OnboardingContextType {
  currentStep: OnboardingStep
  completeStep: (step: OnboardingStep) => void
  isComplete: boolean
  showOnboarding: boolean
  refreshOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const ONBOARDING_STEPS: OnboardingStep[] = ['user-info', 'organization', 'first-update']

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('user-info')
  const [isComplete, setIsComplete] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const checkOnboardingStatus = async () => {
    if (!user) {
      setShowOnboarding(false)
      setIsComplete(false)
      setCurrentStep('user-info')
      setIsChecking(false)
      return
    }

    try {
      setIsChecking(true)
      const profile = await getUserProfile(user.uid)
      
      if (!profile || !profile.onboardingCompleted) {
        // Immediately show onboarding for new users or incomplete onboarding
        setShowOnboarding(true)
        setIsComplete(false)
        setCurrentStep('user-info')
      } else {
        // User has completed onboarding
        setShowOnboarding(false)
        setIsComplete(true)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      // Show onboarding on error to be safe
      setShowOnboarding(true)
      setIsComplete(false)
      setCurrentStep('user-info')
    } finally {
      setIsChecking(false)
    }
  }

  // Run checkOnboardingStatus whenever user changes
  useEffect(() => {
    checkOnboardingStatus()
  }, [user])

  // Don't render children until we've checked onboarding status
  if (isChecking) {
    return null
  }

  const completeStep = async (step: OnboardingStep) => {
    const currentIndex = ONBOARDING_STEPS.indexOf(step)
    if (currentIndex === -1) return

    const nextStep = ONBOARDING_STEPS[currentIndex + 1]
    if (nextStep) {
      setCurrentStep(nextStep)
    } else {
      setIsComplete(true)
      setShowOnboarding(false)
      if (user) {
        try {
          await updateUserProfile(user.uid, {
            onboardingCompleted: true,
            updatedAt: new Date().toISOString()
          })
        } catch (error) {
          console.error('Error updating onboarding status:', error)
        }
      }
    }
  }

  return (
    <OnboardingContext.Provider value={{ 
      currentStep, 
      completeStep, 
      isComplete, 
      showOnboarding,
      refreshOnboarding: checkOnboardingStatus 
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
} 