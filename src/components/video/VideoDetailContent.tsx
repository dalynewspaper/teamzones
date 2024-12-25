'use client'
import { useEffect, useState, useRef } from 'react'
import { VideoUpdate } from '@/types/firestore'
import { useWeek } from '@/contexts/WeekContext'
import { formatDistanceToNow } from 'date-fns'
import { 
  PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
  ArrowsPointingOutIcon, ArrowsPointingInIcon
} from '@heroicons/react/24/solid'
import { formatTime } from '@/lib/utils'

export function VideoDetailContent({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<VideoUpdate | null>(null)
  const { currentWeek } = useWeek()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  useEffect(() => {
    if (currentWeek?.videos) {
      const foundVideo = currentWeek.videos.find(v => v.id === videoId)
      if (foundVideo) setVideo(foundVideo)
    }
  }, [currentWeek, videoId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    
    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    
    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  if (!video) return null

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Video Section */}
      <div className="relative group bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={video.url}
          className="w-full aspect-video"
          onClick={togglePlay}
        />
        
        {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          {/* Progress bar */}
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) {
                videoRef.current.currentTime = parseFloat(e.target.value)
              }
            }}
            className="w-full mb-4"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white hover:text-blue-400">
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="text-white hover:text-blue-400">
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-6 h-6" />
                  ) : (
                    <SpeakerWaveIcon className="w-6 h-6" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value)
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume
                      setVolume(newVolume)
                      setIsMuted(newVolume === 0)
                    }
                  }}
                  className="w-20"
                />
              </div>

              {/* Time */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-blue-400">
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-6 h-6" />
              ) : (
                <ArrowsPointingOutIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-8 space-y-6">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{video.title || 'Weekly Update'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Transcript Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Transcript</h2>
          <div className="prose max-w-none">
            {video.transcript ? (
              video.transcript.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4 text-gray-600">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-gray-500">Transcript is being generated...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 