'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile, updateUserProfile } from '@/services/userService'
import { useSearchParams } from 'next/navigation'

type OnboardingStep = 'user-info' | 'organization' | 'first-update'

interface OnboardingContextType {
  currentStep: OnboardingStep
  completeStep: (step: OnboardingStep) => void
  isComplete: boolean
  showOnboarding: boolean
  refreshOnboarding: () => Promise<void>
  steps: { id: OnboardingStep; title: string; subtitle: string; icon: string }[]
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const DEFAULT_STEPS = [
  { 
    id: 'user-info' as const,
    title: 'Welcome to Open Async',
    subtitle: "Let's personalize your experience",
    icon: '👋'
  },
  { 
    id: 'organization' as const,
    title: 'Set Up Your Workspace',
    subtitle: 'Create a home for your team',
    icon: '🏢'
  },
  { 
    id: 'first-update' as const,
    title: 'Share Your First Update',
    subtitle: 'Connect with your team async-style',
    icon: '🎥'
  }
]

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('user-info')
  const [isComplete, setIsComplete] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Filter out organization step for invited users
  const steps = inviteToken 
    ? DEFAULT_STEPS.filter(step => step.id !== 'organization')
    : DEFAULT_STEPS

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
      
      // If user has an invite token, mark onboarding as complete
      if (inviteToken) {
        setShowOnboarding(false)
        setIsComplete(true)
        if (!profile?.onboardingCompleted) {
          await updateUserProfile(user.uid, {
            onboardingCompleted: true,
            updatedAt: new Date().toISOString()
          })
        }
      } else if (!profile || !profile.onboardingCompleted) {
        // Only show onboarding for new users without invite
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
      // Show onboarding on error only if no invite token
      if (!inviteToken) {
        setShowOnboarding(true)
        setIsComplete(false)
        setCurrentStep('user-info')
      }
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
    const currentIndex = steps.findIndex(s => s.id === step)
    if (currentIndex === -1) return

    const nextStep = steps[currentIndex + 1]
    if (nextStep) {
      setCurrentStep(nextStep.id)
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
      refreshOnboarding: checkOnboardingStatus,
      steps: steps as { id: OnboardingStep; title: string; subtitle: string; icon: string; }[]
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