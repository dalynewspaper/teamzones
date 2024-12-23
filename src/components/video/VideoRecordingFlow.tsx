'use client'
import { useState } from 'react'
import { VideoRecorder } from './VideoRecorder'
import { VideoPreview } from './VideoPreview'
import { VideoPublishForm } from './VideoPublishForm'
import { VideoErrorBoundary } from './VideoErrorBoundary'

type Step = 'record' | 'preview' | 'publish'

interface VideoRecordingFlowProps {
  weekId: string
  onComplete: () => void
  onCancel: () => void
}

export function VideoRecordingFlow({ weekId, onComplete, onCancel }: VideoRecordingFlowProps) {
  const [step, setStep] = useState<Step>('record')
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)

  const handleRecordingComplete = (blob: Blob) => {
    setVideoBlob(blob)
    setStep('preview')
  }

  const handlePreviewConfirm = () => {
    setStep('publish')
  }

  const handlePreviewRetry = () => {
    setVideoBlob(null)
    setStep('record')
  }

  const handlePublishSuccess = () => {
    onComplete()
  }

  return (
    <VideoErrorBoundary onReset={() => setStep('record')}>
      <div className="space-y-4">
        {step === 'record' && (
          <VideoRecorder onComplete={handleRecordingComplete} />
        )}

        {step === 'preview' && videoBlob && (
          <VideoPreview
            videoBlob={videoBlob}
            onConfirm={handlePreviewConfirm}
            onRetry={handlePreviewRetry}
          />
        )}

        {step === 'publish' && videoBlob && (
          <VideoPublishForm
            videoBlob={videoBlob}
            weekId={weekId}
            onSuccess={handlePublishSuccess}
            onCancel={onCancel}
          />
        )}
      </div>
    </VideoErrorBoundary>
  )
} 