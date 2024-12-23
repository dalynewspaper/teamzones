'use client'
import { useEffect } from 'react'
import { useVideoProcessing } from '@/hooks/useVideoProcessing'
import {
  DocumentTextIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { Video } from '@/types/video'

interface VideoProcessingStatusProps {
  userId: string
  videoId: string
  onComplete?: (transcript: string, summary: string) => void
}

interface ProcessingData extends Video {
  retryCount?: number
  lastError?: string
}

const MAX_RETRIES = 3;

export function VideoProcessingStatus({
  userId,
  videoId,
  onComplete
}: VideoProcessingStatusProps) {
  const { status, transcript, summary, error, data } = useVideoProcessing(userId, videoId)
  const processingData = data as ProcessingData

  useEffect(() => {
    if (status === 'completed' && transcript && summary) {
      onComplete?.(transcript, summary)
    }
  }, [status, transcript, summary, onComplete])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Processing Video</h3>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="space-y-3">
        {/* Transcription Status */}
        <div className="flex items-center gap-3">
          <DocumentTextIcon 
            className={`w-5 h-5 ${
              status === 'completed' ? 'text-green-500' : 
              status === 'failed' ? 'text-red-500' : 
              'text-blue-500 animate-pulse'
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Generating Transcript</span>
              {getStatusIcon(status)}
            </div>
            {transcript && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {transcript}
              </p>
            )}
          </div>
        </div>

        {/* Summary Status */}
        <div className="flex items-center gap-3">
          <DocumentMagnifyingGlassIcon 
            className={`w-5 h-5 ${
              status === 'completed' ? 'text-green-500' : 
              status === 'failed' ? 'text-red-500' : 
              'text-blue-500 animate-pulse'
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Creating Summary</span>
              {getStatusIcon(status)}
            </div>
            {summary && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {summary}
              </p>
            )}
          </div>
        </div>
      </div>

      {(processingData?.retryCount ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span>
            Retry attempt {processingData.retryCount} of {MAX_RETRIES}
            {processingData.lastError && ` (${processingData.lastError})`}
          </span>
        </div>
      )}

      {status === 'completed' && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            Processing completed successfully!
          </p>
        </div>
      )}

      {status === 'failed' && (
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            Processing failed. Please try again.
          </p>
        </div>
      )}
    </div>
  )
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />
    case 'failed':
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
    default:
      return (
        <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      )
  }
} 