'use client'
import { useRef, useState, useEffect } from 'react'
import { Button } from '../ui/button'
import {
  VideoCameraIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/solid'
import { VideoRecorderSettings, type RecordingSettings } from './VideoRecorderSettings'
import { TestMode } from './TestMode'

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  maxDuration?: number
}

export function VideoRecorder({ 
  onRecordingComplete, 
  maxDuration = 600
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [error, setError] = useState<string>('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()

  // Default settings
  const [settings, setSettings] = useState<RecordingSettings>({
    videoDeviceId: '',
    audioDeviceId: '',
    resolution: { width: 1280, height: 720 }, // 720p default
    isScreenShare: false
  })

  const setupStream = async () => {
    try {
      let mediaStream: MediaStream

      if (settings.isScreenShare) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: settings.resolution.width,
            height: settings.resolution.height
          }
        })
        
        // Get audio stream separately
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: settings.audioDeviceId }
        })

        // Combine screen and audio streams
        mediaStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ])
      } else {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: settings.videoDeviceId,
            width: settings.resolution.width,
            height: settings.resolution.height
          },
          audio: { deviceId: settings.audioDeviceId }
        })
      }

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError('')
    } catch (err) {
      console.error('Failed to get media stream:', err)
      setError('Failed to access camera or microphone')
    }
  }

  const startRecording = async () => {
    if (!stream) return

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        onRecordingComplete(blob)
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      
      // Start duration timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const currentDuration = Math.floor((Date.now() - startTime) / 1000)
        setDuration(currentDuration)
        
        if (currentDuration >= maxDuration) {
          stopRecording()
        }
      }, 1000)

    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setIsRecording(false)
      setDuration(0)
    }
  }

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
      } else {
        mediaRecorderRef.current.pause()
      }
      setIsPaused(!isPaused)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!isTestMode) {
      setupStream()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [settings, isTestMode])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {isTestMode ? (
        <TestMode 
          settings={settings} 
          onClose={() => setIsTestMode(false)} 
        />
      ) : (
        <>
          <VideoRecorderSettings
            settings={settings}
            onSettingsChange={setSettings}
            onTestMode={() => setIsTestMode(true)}
          />

          <div className="mt-6">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-600 text-white rounded-md flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                  {formatTime(duration)}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {!isRecording ? (
                <Button onClick={startRecording}>
                  <VideoCameraIcon className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button onClick={togglePause} variant="secondary">
                    {isPaused ? (
                      <PlayIcon className="w-5 h-5" />
                    ) : (
                      <PauseIcon className="w-5 h-5" />
                    )}
                  </Button>
                  <Button onClick={stopRecording} variant="secondary">
                    <StopIcon className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 