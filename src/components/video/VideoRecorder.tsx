'use client'
import { VideoRecordingInterface } from './VideoRecordingInterface'

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}

export function VideoRecorder({ onRecordingComplete, onCancel }: VideoRecorderProps) {
  return (
    <VideoRecordingInterface 
      onRecordingComplete={onRecordingComplete}
      onCancel={onCancel}
    />
  )
} 