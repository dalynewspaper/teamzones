'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { VideoRecordIcon, ComputerIcon } from '@/components/ui/icons'
import { Switch } from '@/components/ui/switch'
import { RecordingTimer } from './RecordingTimer'

interface VideoRecordingControlsProps {
  isRecording: boolean
  hasStream: boolean
  mode: 'camera' | 'screen'
  onStartCamera: () => void
  onStartScreen: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onCancel: () => void
}

export function VideoRecordingControls({
  isRecording,
  hasStream,
  mode,
  onStartCamera,
  onStartScreen,
  onStartRecording,
  onStopRecording,
  onCancel
}: VideoRecordingControlsProps) {
  const [includeAudio, setIncludeAudio] = useState(true)

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="audio"
            checked={includeAudio}
            onCheckedChange={setIncludeAudio}
          />
          <label htmlFor="audio" className="text-sm">
            Include Audio
          </label>
        </div>

        {hasStream && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <RecordingTimer isRecording={isRecording} />
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        {!hasStream ? (
          <>
            <Button 
              variant="default"
              size="lg"
              onClick={onStartCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <VideoRecordIcon className="h-5 w-5 mr-2" />
              Record Video
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={onStartScreen}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ComputerIcon className="h-5 w-5 mr-2" />
              Share Screen
            </Button>
          </>
        ) : (
          <>
            {!isRecording ? (
              <Button
                variant="default"
                size="lg"
                onClick={onStartRecording}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={onStopRecording}
                className="border-gray-300"
              >
                Stop Recording
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
} 