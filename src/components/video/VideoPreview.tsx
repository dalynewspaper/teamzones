'use client'
import { useRef, useEffect, useState } from 'react'
import { Button } from '../ui/button'

interface VideoPreviewProps {
  videoBlob: Blob
  onConfirm: () => void
  onRetry: () => void
}

export function VideoPreview({ videoBlob, onConfirm, onRetry }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      const videoUrl = URL.createObjectURL(videoBlob)
      videoRef.current.src = videoUrl

      // Handle video metadata loading
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          setDuration(videoRef.current.duration)
          setIsLoading(false)
        }
      }

      // Handle video loading errors
      videoRef.current.onerror = () => {
        console.error('Error loading video preview')
        setIsLoading(false)
      }

      return () => URL.revokeObjectURL(videoUrl)
    }
  }, [videoBlob])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          onTimeUpdate={handleTimeUpdate}
          playsInline // Better mobile support
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={onRetry} variant="secondary">
          Record Again
        </Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  )
} 