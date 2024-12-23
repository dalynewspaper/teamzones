import { useState } from 'react'

interface VideoRecorderSettingsProps {
  onSettingsChange: (settings: RecordingSettings) => void
}

export interface RecordingSettings {
  videoDeviceId: string
  audioDeviceId: string
  resolution: {
    width: number
    height: number
  }
}

export function VideoRecorderSettings({ onSettingsChange }: VideoRecorderSettingsProps) {
  return (
    <div>
      {/* Settings UI will go here */}
    </div>
  )
} 