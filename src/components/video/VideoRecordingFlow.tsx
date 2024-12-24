'use client'
import { useState } from 'react'
import { VideoRecorder } from './VideoRecorder'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { VideoError } from '@/lib/errors'
import { Spinner } from '@/components/ui/spinner'
import { uploadVideo } from '@/services/videoService'

interface VideoRecordingFlowProps {
  weekId: string
  onComplete: () => void
  onCancel: () => void
}

export function VideoRecordingFlow({ weekId, onComplete, onCancel }: VideoRecordingFlowProps) {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleUpload = async () => {
    if (!recordedBlob || !user) return

    try {
      setUploading(true)
      setError(null)
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { 
        type: 'video/webm' 
      })
      await uploadVideo(file, user.uid, weekId)
      onComplete()
    } catch (err) {
      console.error('Upload failed:', err)
      if (err instanceof VideoError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred while uploading. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  if (recordedBlob) {
    return (
      <div className="space-y-4">
        {error && (
          <Alert type="error" title="Upload Failed">
            {error}
          </Alert>
        )}

        <video 
          src={URL.createObjectURL(recordedBlob)} 
          controls 
          className="w-full rounded-lg"
        />
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setRecordedBlob(null)}>
            Record Again
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Uploading...
              </>
            ) : (
              'Upload Recording'
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <VideoRecorder 
      onRecordingComplete={setRecordedBlob} 
      onCancel={onCancel}
    />
  )
}