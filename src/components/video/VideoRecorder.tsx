'use client'
import { SetStateAction, useState } from 'react'
import { VideoRecordingInterface } from './VideoRecordingInterface'
import { uploadVideo } from '@/services/videoService'
import { useWeek } from '@/contexts/WeekContext'
import { Alert } from '@/components/ui/alert'

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onRecordingComplete, onCancel }: VideoRecorderProps) {
  const [error, setError] = useState<string | null>(null)

  const handleRecordingComplete = async (blob: Blob) => {
    onRecordingComplete(blob)
  }

  return (
    <div className="relative">
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      <VideoRecordingInterface
        onRecordingComplete={handleRecordingComplete}
        onCancel={onCancel}
      />
    </div>
  )
} 