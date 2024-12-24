'use client'
import { VideoRecordIcon } from '@/components/ui/icons'
import { VideoRecordingButton } from './VideoRecordingButton'

interface EmptyStateProps {
  weekId: string
}

export function EmptyState({ weekId }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <VideoRecordIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No videos</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by recording your first video update.
      </p>
      <div className="mt-6">
        <VideoRecordingButton weekId={weekId} />
      </div>
    </div>
  )
} 