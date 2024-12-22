'use client'
import { WeekNavigator } from '@/components/dashboard/WeekNavigator'
import { ContentHeader } from '@/components/dashboard/ContentHeader'
import { VideoGrid } from '@/components/dashboard/VideoGrid'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { WeekProvider, useWeek } from '@/contexts/WeekContext'

const dummyVideos: any[] = [] // Set to empty array to test empty state

function DashboardContent() {
  const { weekId } = useWeek()

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <WeekNavigator />
      <ContentHeader weekId={weekId} />
      {dummyVideos.length > 0 ? (
        <VideoGrid videos={dummyVideos} />
      ) : (
        <EmptyState weekId={weekId} />
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <WeekProvider>
      <DashboardContent />
    </WeekProvider>
  )
} 