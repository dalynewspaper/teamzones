'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && 'organizationId' in user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <OnboardingProvider>
      <OnboardingLayout />
    </OnboardingProvider>
  )
} 