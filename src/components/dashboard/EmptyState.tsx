'use client'
import { VideoCameraIcon } from '@heroicons/react/24/outline'
import { VideoRecordingButton } from './VideoRecordingButton'

interface EmptyStateProps {
  weekId: string
}

export function EmptyState({ weekId }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
      <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No updates for this week</h3>
      <p className="mt-2 text-sm text-gray-500">
        Get started by recording your first weekly update for the team.
      </p>
      <div className="mt-6">
        <VideoRecordingButton weekId={weekId}>
          Record Update
        </VideoRecordingButton>
      </div>
    </div>
  )
} 