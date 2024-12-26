'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { WeekSelector } from '@/components/dashboard/WeekSelector'
import { RecordingModal } from '@/components/dashboard/RecordingModal'
import { useOnboarding } from '@/contexts/OnboardingContext'

export default function DashboardPage() {
  const [showRecording, setShowRecording] = useState(false)
  const searchParams = useSearchParams()
  const { refreshOnboarding } = useOnboarding()

  useEffect(() => {
    // Handle onboarding state from URL
    if (searchParams.get('onboarding') === 'true') {
      refreshOnboarding()
      // Clean up the URL
      const url = new URL(window.location.href)
      url.searchParams.delete('onboarding')
      window.history.replaceState({}, '', url)
    }
    // Handle recording modal
    if (searchParams.get('record') === 'true') {
      setShowRecording(true)
    }
  }, [searchParams, refreshOnboarding])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <WeekSelector />

      {/* Recording Modal */}
      <RecordingModal
        isOpen={showRecording}
        onClose={() => setShowRecording(false)}
      />
    </div>
  )
} 