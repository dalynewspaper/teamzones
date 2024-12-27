'use client'

import { Dashboard } from '@/components/dashboard/Dashboard'
import { useSearchParams } from 'next/navigation'
import VideoPageClient from '@/components/video/VideoPageClient'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('video')

  if (videoId) {
    return <VideoPageClient videoId={videoId} />
  }

  return <Dashboard />
} 