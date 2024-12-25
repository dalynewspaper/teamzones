'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile, updateUserProfile } from '@/services/userService'
import { useSearchParams, useRouter } from 'next/navigation'

interface OnboardingState {
  currentStep: 'team' | 'first-update'
  isComplete: boolean
  shouldShow: boolean
}

interface OnboardingContextType {
  state: OnboardingState
  completeStep: (step: OnboardingState['currentStep']) => Promise<void>
  skipOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isNewUser = searchParams.get('newUser') === 'true'
  
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'team',
    isComplete: false,
    shouldShow: false
  })

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) return

      const profile = await getUserProfile(user.uid)
      
      if (profile?.onboardingCompleted) {
        setState(current => ({
          ...current,
          isComplete: true,
          shouldShow: false
        }))
        return
      }

      setState(current => ({
        ...current,
        isComplete: false,
        shouldShow: true
      }))
    }

    if (user) {
      checkOnboardingStatus()
    }
  }, [user, isNewUser])

  const completeStep = async (step: OnboardingState['currentStep']) => {
    if (!user) return

    const steps: OnboardingState['currentStep'][] = ['team', 'first-update']
    const currentIndex = steps.indexOf(step)
    
    if (currentIndex === steps.length - 1) {
      await updateUserProfile(user.uid, {
        onboardingCompleted: true,
        updatedAt: new Date().toISOString()
      })
      setState({ currentStep: step, isComplete: true, shouldShow: false })
      router.push('/dashboard')
    } else {
      setState({ 
        currentStep: steps[currentIndex + 1], 
        isComplete: false, 
        shouldShow: true 
      })
    }
  }

  const skipOnboarding = async () => {
    if (!user || state.currentStep === 'team') return
    
    await updateUserProfile(user.uid, { 
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    })
    setState({ currentStep: 'team', isComplete: true, shouldShow: false })
    router.push('/dashboard')
  }

  return (
    <OnboardingContext.Provider value={{ state, completeStep, skipOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
} 