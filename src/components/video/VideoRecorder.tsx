'use client'
import { useRef, useState, useEffect } from 'react'
import { Button } from '../ui/button'
import {
  VideoCameraIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
  ComputerDesktopIcon,
  CameraIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import { VideoRecorderSettings, type RecordingSettings } from './VideoRecorderSettings'
import { TestMode } from './TestMode'

interface VideoRecorderProps {
  onComplete: (blob: Blob) => void
  maxDuration?: number
}

export function VideoRecorder({ 
  onComplete, 
  maxDuration = 600 // 10 minutes default
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [error, setError] = useState<string>('')
  const [isScreenShare, setIsScreenShare] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()

  // Default settings
  const [settings, setSettings] = useState<RecordingSettings>({
    videoDeviceId: '',
    audioDeviceId: '',
    resolution: { width: 1920, height: 1080 }, // 1080p default
    isScreenShare: false
  })

  const setupStream = async (useScreen = false) => {
    try {
      let mediaStream: MediaStream

      if (useScreen) {
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
      setIsScreenShare(useScreen)
    } catch (err) {
      console.error('Failed to get media stream:', err)
      setError('Failed to access camera or microphone')
    }
  }

  const startRecording = async () => {
    if (!stream) return

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: 'video/webm;codecs=vp9,opus'
        })
        onComplete(blob)
      }

      mediaRecorder.onerror = (event) => {
        setError('Recording failed')
        stopRecording()
      }

      mediaRecorder.start(1000) // Collect data every second
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
      
      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
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

  const toggleRecordingMode = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    await setupStream(!isScreenShare)
  }

  useEffect(() => {
    if (!isTestMode) {
      setupStream(isScreenShare)
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [settings, isTestMode])

  return (
    <div className="w-full max-w-3xl mx-auto animate-fadeIn">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 animate-slideIn">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {isTestMode ? (
        <TestMode 
          settings={settings} 
          onClose={() => setIsTestMode(false)}
          onError={(msg) => setError(msg)}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <VideoRecorderSettings
              settings={settings}
              onSettingsChange={setSettings}
              onTestMode={() => setIsTestMode(true)}
            />

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>Max {Math.floor(maxDuration / 60)} minutes</span>
            </div>
          </div>

          <div className="relative">
            {/* Main Video Preview */}
            <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center gap-2 animate-scaleIn">
                  <span className="relative recording-pulse">
                    <span className="block w-2 h-2 bg-red-500 rounded-full" />
                  </span>
                  <span className="font-medium">{formatTime(duration)}</span>
                </div>
              )}

              {/* Camera/Screen Switch Overlay */}
              {!isRecording && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Button
                    onClick={toggleRecordingMode}
                    variant="secondary"
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10"
                  >
                    {isScreenShare ? (
                      <>
                        <CameraIcon className="w-4 h-4 mr-2" />
                        Camera View
                      </>
                    ) : (
                      <>
                        <ComputerDesktopIcon className="w-4 h-4 mr-2" />
                        Screen Share
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Connection Status */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white rounded-full text-sm">
                <SignalIcon className="w-4 h-4" />
                <span>Connected</span>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-6">
              <div className="flex gap-3 p-2 bg-white rounded-full shadow-lg border border-gray-200">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="rounded-full px-6 flex items-center gap-2 animate-scaleIn"
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={togglePause} 
                      variant="secondary"
                      className="rounded-full px-5 flex items-center gap-2"
                    >
                      {isPaused ? (
                        <>
                          <PlayIcon className="w-5 h-5" />
                          Resume
                        </>
                      ) : (
                        <>
                          <PauseIcon className="w-5 h-5" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={stopRecording} 
                      variant="secondary"
                      className="rounded-full px-5 flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      <StopIcon className="w-5 h-5" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recording Tips */}
          {!isRecording && (
            <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-700">
              <h4 className="font-medium mb-2">Recording Tips</h4>
              <ul className="space-y-1 list-disc list-inside text-blue-600">
                <li>Ensure good lighting and a quiet environment</li>
                <li>Test your audio and video before starting</li>
                <li>Keep your updates concise and focused</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 