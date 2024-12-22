'use client'
import { VideoRecordingButton } from './VideoRecordingButton'

interface ContentHeaderProps {
  weekId: string
}

export function ContentHeader({ weekId }: ContentHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly Updates</h1>
        </div>
        <div className="flex items-center space-x-2">
          <VideoRecordingButton weekId={weekId}>
            New video
          </VideoRecordingButton>
        </div>
      </div>
    </div>
  )
} 