'use client'
import { WeekSelector } from '@/components/dashboard/WeekSelector'
import { VideoList } from '@/components/video/VideoList'
import { VideoRecordingButton } from '@/components/dashboard/VideoRecordingButton'
import { useWeek } from '@/contexts/WeekContext'

export default function DashboardPage() {
  const { weekId } = useWeek()

  return (
    <div className="space-y-6 p-6">
      <WeekSelector />
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Weekly Updates</h1>
        <VideoRecordingButton weekId={weekId} />
      </div>

      <VideoList />
    </div>
  )
} 