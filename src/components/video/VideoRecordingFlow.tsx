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
  const [error, setError] = useState<string | null>(null)

  const handleRecordingComplete = (blob: Blob) => {
    try {
      setVideoBlob(blob)
      setStep('preview')
      setError(null)
    } catch (err) {
      setError('Failed to process recording')
      console.error('Recording error:', err)
    }
  }

  const handlePreviewConfirm = () => {
    if (!videoBlob) {
      setError('No video recorded')
      return
    }
    setStep('publish')
  }

  const handlePreviewRetry = () => {
    setVideoBlob(null)
    setStep('record')
    setError(null)
  }

  const handlePublishSuccess = () => {
    try {
      onComplete()
    } catch (err) {
      setError('Failed to complete publishing')
      console.error('Publish completion error:', err)
    }
  }

  const handlePublishCancel = () => {
    onCancel()
  }

  const handleError = () => {
    setVideoBlob(null)
    setStep('record')
    setError(null)
  }

  return (
    <VideoErrorBoundary onReset={handleError}>
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

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
            onCancel={handlePublishCancel}
          />
        )}
      </div>
    </VideoErrorBoundary>
  )
} 