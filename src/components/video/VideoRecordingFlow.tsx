'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadVideo } from '@/services/videoService'
import { VideoRecorderSettings } from './VideoRecorderSettings'

interface VideoRecordingFlowProps {
  weekId: string
  onComplete: () => void
  onCancel: () => void
}

export function VideoRecordingFlow({ weekId, onComplete, onCancel }: VideoRecordingFlowProps) {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      // Recording logic here
      setIsRecording(true)
    } catch (err) {
      setError('Failed to access camera/microphone')
    }
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // Stop recording logic here
  }

  const handleUpload = async () => {
    if (!recordedBlob || !user) return

    try {
      await uploadVideo({
        file: recordedBlob,
        userId: user.uid,
        weekId,
        title: `Weekly Update - ${new Date().toLocaleDateString()}`,
        visibility: 'team',
        onProgress: setUploadProgress
      })
      onComplete()
    } catch (err) {
      setError('Failed to upload video')
    }
  }

  return (
    <div className="space-y-4">
      <VideoRecorderSettings
        onSettingsChange={(settings) => {
          // Handle settings change
        }}
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Cancel
        </button>
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Stop Recording
          </button>
        )}
      </div>
    </div>
  )
} 