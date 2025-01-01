'use client'

import { useSearchParams } from 'next/navigation'
import VideoPageClient from '@/components/video/VideoPageClient'

export function DashboardPageContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('video')

  if (videoId) {
    return <VideoPageClient videoId={videoId} />
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      </div>
    </div>
  )
} 