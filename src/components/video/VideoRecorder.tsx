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
  SignalIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline'
import { VideoRecorderSettings, type RecordingSettings } from './VideoRecorderSettings'
import { TestMode } from './TestMode'
import { useDraggable } from '@/hooks/useDraggable'
import { useResizable } from '@/hooks/useResizable'

interface VideoRecorderProps {
  onComplete: (blob: Blob) => void
  maxDuration?: number
}

interface PipSize {
  width: number
  height: number
}

interface ScreenShareQuality {
  fps: number
  bitrate: number
  resolution: {
    width: number
    height: number
  }
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
  const [pipPosition, setPipPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('bottom-right')
  const [isPipExpanded, setIsPipExpanded] = useState(false)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  
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

  const [pipSize, setPipSize] = useState<PipSize>({ width: 320, height: 180 }) // 16:9 ratio
  const { size, isResizing, startResize } = useResizable(pipSize, setPipSize, {
    minWidth: 240,
    maxWidth: 640,
    aspectRatio: 16/9
  })

  const SCREEN_SHARE_QUALITIES: Record<string, ScreenShareQuality> = {
    high: {
      fps: 60,
      bitrate: 8000000, // 8 Mbps
      resolution: { width: 1920, height: 1080 }
    },
    medium: {
      fps: 30,
      bitrate: 4000000, // 4 Mbps
      resolution: { width: 1280, height: 720 }
    },
    low: {
      fps: 30,
      bitrate: 2000000, // 2 Mbps
      resolution: { width: 854, height: 480 }
    }
  }

  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')

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

  const setupScreenShareWithCamera = async () => {
    try {
      // Get screen capture stream
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: settings.resolution.width,
          height: settings.resolution.height
        }
      })

      // Get camera stream
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: settings.videoDeviceId,
          width: 1280, // HD for camera
          height: 720
        },
        audio: { deviceId: settings.audioDeviceId }
      })

      // Set up video elements
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream
      }
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = videoStream
      }

      setScreenStream(displayStream)
      setCameraStream(videoStream)
      setIsScreenShare(true)
      setError('')

      // Combine audio tracks (if needed)
      const audioTracks = videoStream.getAudioTracks()
      
      // Create a combined stream for recording
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioTracks
      ])
      
      setStream(combinedStream)

    } catch (err) {
      console.error('Failed to set up screen sharing with camera:', err)
      setError('Failed to access screen sharing or camera')
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

  const togglePipSize = () => {
    setIsPipExpanded(!isPipExpanded)
  }

  const movePip = (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    setPipPosition(position)
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const { position, isDragging } = useDraggable(containerRef)

  useEffect(() => {
    if (!isTestMode) {
      setupStream(isScreenShare)
    }

    return () => {
      [stream, cameraStream, screenStream].forEach(s => {
        if (s) {
          s.getTracks().forEach(track => track.stop())
        }
      })
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
            {/* Main Video Container */}
            <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
              {isScreenShare ? (
                <>
                  {/* Screen Share Video */}
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Camera PiP */}
                  <div 
                    ref={containerRef}
                    className={`
                      absolute transition-all duration-200 ease-in-out
                      ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                    `}
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px)`,
                      width: `${size.width}px`,
                      height: `${size.height}px`,
                      touchAction: 'none'
                    }}
                  >
                    <div className="relative w-full h-full group">
                      <video
                        ref={cameraVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-lg border border-white/20 shadow-lg"
                      />
                      
                      {/* Resize Handles */}
                      {!isRecording && (
                        <>
                          {/* Corner Handles */}
                          <div
                            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 'se')}
                          >
                            <div className="absolute bottom-1 right-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                          <div
                            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 'sw')}
                          >
                            <div className="absolute bottom-1 left-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                          <div
                            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 'ne')}
                          >
                            <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                          <div
                            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 'nw')}
                          >
                            <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>

                          {/* Edge Handles */}
                          <div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-2 cursor-n-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 'n')}
                          >
                            <div className="mx-auto w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                          <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 cursor-s-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 's')}
                          >
                            <div className="mx-auto w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 cursor-w-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 'w')}
                          >
                            <div className="mt-3 w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                          <div
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-8 cursor-e-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => startResize(e, 'e')}
                          >
                            <div className="mt-3 w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                        </>
                      )}

                      {/* Enhanced PiP Controls with Quality Selector */}
                      {!isRecording && (
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1 p-1 bg-black/80 backdrop-blur-sm rounded-lg shadow-lg">
                            {/* Quality Selector */}
                            <div className="relative group/quality">
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-xs text-white/80 hover:text-white border-r border-white/20"
                              >
                                <span>{quality.charAt(0).toUpperCase() + quality.slice(1)}</span>
                                <ChevronUpDownIcon className="w-3 h-3" />
                              </button>
                              
                              {/* Quality Dropdown */}
                              <div className="absolute left-0 top-full mt-1 py-1 w-32 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg invisible group-hover/quality:visible">
                                {Object.entries(SCREEN_SHARE_QUALITIES).map(([key, value]) => (
                                  <button
                                    key={key}
                                    onClick={() => setQuality(key as 'high' | 'medium' | 'low')}
                                    className={`
                                      w-full px-3 py-1.5 text-left text-xs
                                      ${quality === key ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                                    `}
                                  >
                                    <div className="font-medium">
                                      {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </div>
                                    <div className="text-[10px] opacity-70">
                                      {value.resolution.height}p • {value.fps}fps
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Existing aspect ratio and position controls */}
                            <div className="flex items-center gap-2 px-2 border-r border-white/20">
                              <button
                                onClick={() => setPipSize({ width: 320, height: 180 })}
                                className="text-xs text-white/80 hover:text-white"
                                title="16:9"
                              >
                                16:9
                              </button>
                              <button
                                onClick={() => setPipSize({ width: 320, height: 240 })}
                                className="text-xs text-white/80 hover:text-white"
                                title="4:3"
                              >
                                4:3
                              </button>
                            </div>
                            
                            {/* Existing position controls */}
                            <button
                              onClick={() => movePip('top-left')}
                              className="p-1 rounded hover:bg-white/10 text-white"
                              title="Move to Top Left"
                            >
                              <ArrowUpLeftIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => movePip('top-right')}
                              className="p-1 rounded hover:bg-white/10 text-white"
                              title="Move to Top Right"
                            >
                              <ArrowUpRightIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => movePip('bottom-left')}
                              className="p-1 rounded hover:bg-white/10 text-white"
                              title="Move to Bottom Left"
                            >
                              <ArrowDownLeftIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => movePip('bottom-right')}
                              className="p-1 rounded hover:bg-white/10 text-white"
                              title="Move to Bottom Right"
                            >
                              <ArrowDownRightIcon className="w-4 h-4" />
                            </button>
                            <div className="w-px bg-white/20" />
                            <button
                              onClick={togglePipSize}
                              className="p-1 rounded hover:bg-white/10 text-white"
                              title={isPipExpanded ? "Shrink" : "Expand"}
                            >
                              {isPipExpanded ? (
                                <ArrowsPointingInIcon className="w-4 h-4" />
                              ) : (
                                <ArrowsPointingOutIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Recording Indicator for PiP */}
                      {isRecording && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-full">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                      )}

                      {/* Screen Share Quality Indicator */}
                      {isScreenShare && !isRecording && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-black/70 text-white rounded-full">
                          {SCREEN_SHARE_QUALITIES[quality].fps}fps • {SCREEN_SHARE_QUALITIES[quality].resolution.height}p
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // Regular camera view
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center gap-2 animate-scaleIn">
                  <span className="relative recording-pulse">
                    <span className="block w-2 h-2 bg-red-500 rounded-full" />
                  </span>
                  <span className="font-medium">{formatTime(duration)}</span>
                </div>
              )}

              {/* Modified Camera/Screen Switch Button */}
              {!isRecording && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Button
                    onClick={() => isScreenShare ? setupStream(false) : setupScreenShareWithCamera()}
                    variant="secondary"
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10"
                  >
                    {isScreenShare ? (
                      <>
                        <CameraIcon className="w-4 h-4 mr-2" />
                        Camera Only
                      </>
                    ) : (
                      <>
                        <ComputerDesktopIcon className="w-4 h-4 mr-2" />
                        Screen + Camera
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

// Helper function for PiP positioning
function getPipPositionClasses(position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'): string {
  switch (position) {
    case 'top-right':
      return 'top-4 right-4'
    case 'top-left':
      return 'top-4 left-4'
    case 'bottom-right':
      return 'bottom-4 right-4'
    case 'bottom-left':
      return 'bottom-4 left-4'
  }
} 