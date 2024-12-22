'use client'
import { useState } from 'react'
import { VideoRecorder } from './VideoRecorder'
import { VideoPreview } from './VideoPreview'
import { VideoPublishForm } from './VideoPublishForm'

type RecordingStep = 'recording' | 'preview' | 'publishing'

interface VideoRecordingFlowProps {
  weekId: string
  onComplete: () => void
  onCancel: () => void
}

export function VideoRecordingFlow({ 
  weekId, 
  onComplete, 
  onCancel 
}: VideoRecordingFlowProps) {
  const [step, setStep] = useState<RecordingStep>('recording')
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)

  const handleRecordingComplete = (blob: Blob) => {
    setVideoBlob(blob)
    setStep('preview')
  }

  const handlePreviewConfirm = () => {
    setStep('publishing')
  }

  const handlePreviewRetry = () => {
    setVideoBlob(null)
    setStep('recording')
  }

  const handlePublishSuccess = () => {
    onComplete()
  }

  if (!weekId) return null

  return (
    <div className="w-full max-w-2xl mx-auto">
      {step === 'recording' && (
        <VideoRecorder
          onRecordingComplete={handleRecordingComplete}
          maxDuration={600} // 10 minutes
        />
      )}

      {step === 'preview' && videoBlob && (
        <VideoPreview
          videoBlob={videoBlob}
          onConfirm={handlePreviewConfirm}
          onRetry={handlePreviewRetry}
        />
      )}

      {step === 'publishing' && videoBlob && (
        <VideoPublishForm
          videoBlob={videoBlob}
          weekId={weekId}
          onSuccess={handlePublishSuccess}
          onCancel={onCancel}
        />
      )}
    </div>
  )
} 