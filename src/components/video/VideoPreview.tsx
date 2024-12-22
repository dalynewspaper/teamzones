'use client'
import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid'

interface VideoPreviewProps {
  videoBlob: Blob
  onConfirm: () => void
  onRetry: () => void
}

export function VideoPreview({ videoBlob, onConfirm, onRetry }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={URL.createObjectURL(videoBlob)}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-200"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-gray-200"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-6 h-6" />
              ) : (
                <SpeakerWaveIcon className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <div className="relative h-1 bg-gray-600 rounded">
                <div
                  className="absolute h-full bg-white rounded"
                  style={{
                    width: `${(currentTime / duration) * 100}%`,
                  }}
                />
              </div>
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button onClick={onRetry} variant="secondary">
          Record Again
        </Button>
        <Button onClick={onConfirm}>
          Continue to Publish
        </Button>
      </div>
    </div>
  )
} 