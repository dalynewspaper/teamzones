'use client'

import { useSearchParams } from 'next/navigation'
import VideoPageClient from '@/components/video/VideoPageClient'
import { WeeklyGoalsDisplay } from './WeeklyGoalsDisplay'

export function DashboardPageContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('video')

  if (videoId) {
    return <VideoPageClient videoId={videoId} />
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid gap-6">
          {/* Weekly Goals Section */}
          <WeeklyGoalsDisplay />
          
          {/* Other dashboard sections can go here */}
        </div>
      </div>
    </div>
  )
} 