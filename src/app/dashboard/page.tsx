'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { VideoList } from '@/components/video/VideoList'
import { VideoRecordingButton } from '@/components/dashboard/VideoRecordingButton'
import { ContentHeader } from '@/components/dashboard/ContentHeader'
import { Alert } from '@/components/ui/alert'
import { getCurrentWeekId } from '@/lib/date'

export default function DashboardPage() {
  const { user } = useAuth()
  const [weekId] = useState(getCurrentWeekId())
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-sm underline"
          >
            Try again
          </button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ContentHeader
        title="Weekly Updates"
        description={`Week of ${new Date(weekId).toLocaleDateString()}`}
        action={
          <VideoRecordingButton weekId={weekId} />
        }
      />
      
      <VideoList 
        weekId={weekId} 
        onError={(message) => setError(message)}
      />
    </div>
  )
} 