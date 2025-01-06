'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useToast } from '@/components/ui/use-toast'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Square, Circle, Settings, Play, Pause, Mic, MicOff, Volume2, VolumeX, Camera, Monitor, Layout } from 'lucide-react'
import { VideoRecorder } from './VideoRecorder'
import { RecordingSettings } from './RecordingSettings'
import { KeyboardShortcutsLegend } from './KeyboardShortcutsLegend'
import { formatTime } from '@/lib/utils'

interface VideoDevice {
  deviceId: string
  label: string
}

interface VideoRecordingInterfaceProps {
  onRecordingComplete: (recording: { 
    blob: Blob;
    metadata: {
      duration: string;
      size: number;
      type: string;
      timestamp: string;
    }
  }) => void;
  onCancel: () => void;
  onError?: (error: string) => void;
  initialLayout?: 'camera' | 'screen' | 'pip';
  initialQuality?: '720p' | '1080p' | '4k';
  initialAudioSource?: 'mic' | 'system' | 'both';
}

export function VideoRecordingInterface({
  onRecordingComplete,
  onCancel,
  onError,
  initialLayout = 'camera',
  initialQuality = '1080p',
  initialAudioSource = 'both'
}: VideoRecordingInterfaceProps) {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<VideoDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isSystemAudioEnabled, setIsSystemAudioEnabled] = useState(true)
  const audioAnalyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>(initialQuality)
  const [layout, setLayout] = useState<'camera' | 'screen' | 'pip'>(initialLayout)
  const [backgroundBlur, setBackgroundBlur] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()

  // Load available devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId}`
          }))
        setDevices(videoDevices)
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId)
        }
      } catch (error) {
        console.error('Error loading devices:', error)
        onError?.('Failed to load video devices')
      }
    }

    loadDevices()
  }, [onError])

  // Audio level monitoring
  useEffect(() => {
    if (!stream || !isMicEnabled) return
    
    // Check if the stream has audio tracks before proceeding
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) return

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    audioContextRef.current = audioContext
    audioAnalyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const updateAudioLevel = () => {
      if (!audioAnalyserRef.current) return
      audioAnalyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average)
      requestAnimationFrame(updateAudioLevel)
    }
    updateAudioLevel()

    return () => {
      audioContext.close()
      audioContextRef.current = null
      audioAnalyserRef.current = null
    }
  }, [stream, isMicEnabled])

  // Track elapsed time
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused])

  // Start camera feed on mount
  useEffect(() => {
    const startCameraFeed = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            ...getResolutionConstraints(),
            deviceId: selectedDeviceId,
            facingMode: 'user'
          },
          audio: false // Don't enable audio until recording starts
        }

        const videoStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(videoStream)
      } catch (err) {
        console.error('Camera access error:', err)
        setError('Failed to access camera. Please check permissions.')
        onError?.('Camera access failed')
      }
    }

    if (layout === 'camera' && !stream) {
      startCameraFeed()
    }

    return () => {
      stopStream()
    }
  }, [layout, selectedDeviceId])

  // ... existing keyboard shortcuts ...

  const getResolutionConstraints = () => {
    switch (resolution) {
      case '4k':
        return { width: 3840, height: 2160 }
      case '1080p':
        return { width: 1920, height: 1080 }
      case '720p':
        return { width: 1280, height: 720 }
    }
  }

  const startRecording = async () => {
    try {
      // Stop any existing streams first
      stopStream()
      
      // Get camera stream if needed
      let videoStream: MediaStream | null = null
      if (layout !== 'screen') {
        const constraints: MediaStreamConstraints = {
          video: {
            ...getResolutionConstraints(),
            deviceId: selectedDeviceId,
            facingMode: 'user'
          },
          audio: isMicEnabled
        }

        try {
          videoStream = await navigator.mediaDevices.getUserMedia(constraints)
        } catch (err) {
          console.error('Camera access error:', err)
          setError('Failed to access camera. Please check permissions.')
          onError?.('Camera access failed')
          return
        }
      }

      // Get screen stream if needed
      let screenStream: MediaStream | null = null
      if (layout !== 'camera') {
        try {
          // @ts-ignore - TypeScript doesn't know about getDisplayMedia options
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              ...getResolutionConstraints(),
              frameRate: resolution === '4k' ? 30 : 60
            },
            audio: isSystemAudioEnabled
          })

          // Handle user cancelling screen share
          screenStream.getVideoTracks()[0].onended = () => {
            if (isRecording) {
              stopRecording()
              setError('Screen sharing was stopped')
              onError?.('Screen sharing stopped')
            }
          }
        } catch (err) {
          console.error('Screen sharing error:', err)
          if (layout === 'screen') {
            setError('Failed to start screen sharing')
            onError?.('Screen sharing failed')
            if (videoStream) {
              videoStream.getTracks().forEach(track => track.stop())
            }
            return
          }
          // Fall back to camera only if PiP fails
          if (layout === 'pip') {
            setLayout('camera')
          }
        }
      }

      // Combine streams based on layout
      let finalStream: MediaStream
      if (layout === 'pip' && videoStream && screenStream) {
        const tracks = [
          ...screenStream.getVideoTracks(),
          ...videoStream.getVideoTracks(),
          ...(isMicEnabled ? videoStream.getAudioTracks() : []),
          ...(isSystemAudioEnabled ? screenStream.getAudioTracks() : [])
        ]
        finalStream = new MediaStream(tracks)
      } else if (layout === 'screen' && screenStream) {
        finalStream = screenStream
      } else if (videoStream) {
        finalStream = videoStream
      } else {
        throw new Error('No valid stream available')
      }

      setStream(finalStream)
      
      // Set up MediaRecorder with optimal settings
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const options = {
        mimeType,
        videoBitsPerSecond: resolution === '4k' ? 8000000 : 4000000,
        audioBitsPerSecond: 128000
      }

      const mediaRecorder = new MediaRecorder(finalStream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Handle data available in larger chunks for better quality
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Clean up properly when recording stops
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType })
          // Create a video element to get duration
          const video = document.createElement('video')
          video.src = URL.createObjectURL(blob)
          
          await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              const duration = Math.round(video.duration)
              const minutes = Math.floor(duration / 60)
              const seconds = duration % 60
              const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
              
              onRecordingComplete({
                blob,
                metadata: {
                  duration: formattedDuration,
                  size: blob.size,
                  type: blob.type,
                  timestamp: new Date().toISOString()
                }
              })
              resolve(null)
            }
          })
        } catch (err) {
          console.error('Error creating recording blob:', err)
          onError?.('Failed to save recording')
        } finally {
          stopStream()
          setIsRecording(false)
          setIsPaused(false)
          setElapsedTime(0)
        }
      }

      // Handle recording errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred')
        onError?.('Recording error')
        stopRecording()
      }

      mediaRecorder.start(1000) // Capture data every second for smoother recording
      setIsRecording(true)
      setError(null)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please try again.')
      onError?.('Recording setup failed')
      stopStream()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      setElapsedTime(0)
      stopStream()
    }
  }

  const togglePause = () => {
    if (!mediaRecorderRef.current) return

    if (isPaused) {
      mediaRecorderRef.current.resume()
    } else {
      mediaRecorderRef.current.pause()
    }
    setIsPaused(!isPaused)
  }

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop()
        } catch (err) {
          console.error('Error stopping track:', err)
        }
      })
      setStream(null)
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStream()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-[#141414] flex flex-col">
      {error && (
        <Alert variant="destructive" className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="font-semibold">Error</div>
          <div>{error}</div>
        </Alert>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-[1200px] aspect-video">
            <VideoRecorder
              stream={stream}
              isRecording={isRecording}
              backgroundBlur={backgroundBlur}
            />
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="relative w-full bg-transparent">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between bg-black/90 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/[0.08]">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className={`rounded-md transition-all duration-200 flex items-center space-x-2 h-8 px-3 ${
                  isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">Stop</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm font-medium">Record</span>
                  </>
                )}
              </Button>

              {isRecording && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePause}
                  className="rounded-md text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                  {isPaused ? (
                    <Play className="w-3.5 h-3.5" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" />
                  )}
                </Button>
              )}
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-6">
              {/* Audio Controls */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMicEnabled(!isMicEnabled)}
                    className={`hover:bg-white/10 rounded-md h-8 w-8 ${isMicEnabled ? 'text-white' : 'text-white/40'}`}
                  >
                    {isMicEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </Button>
                  {isMicEnabled && (
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${(audioLevel / 255) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSystemAudioEnabled(!isSystemAudioEnabled)}
                  className={`hover:bg-white/10 rounded-md h-8 w-8 ${isSystemAudioEnabled ? 'text-white' : 'text-white/40'}`}
                >
                  {isSystemAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </Button>
              </div>

              {/* Recording Time & Quality */}
              <div className="flex items-center space-x-3">
                {isRecording && (
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-sm font-medium tabular-nums">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                )}
                <div className="text-white/60 text-xs font-medium px-1.5 py-0.5 rounded bg-white/10">
                  {resolution}
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center p-1 bg-white/[0.07] rounded-md">
                <Button
                  variant={layout === 'camera' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setLayout('camera')}
                  className={`h-6 w-6 rounded-sm ${
                    layout === 'camera' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                  }`}
                  title="Camera Only"
                >
                  <Camera className="h-3 w-3" />
                </Button>
                <Button
                  variant={layout === 'screen' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setLayout('screen')}
                  className={`h-6 w-6 rounded-sm ${
                    layout === 'screen' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                  }`}
                  title="Screen Share"
                >
                  <Monitor className="h-3 w-3" />
                </Button>
                <Button
                  variant={layout === 'pip' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setLayout('pip')}
                  className={`h-6 w-6 rounded-sm ${
                    layout === 'pip' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                  }`}
                  title="Picture in Picture"
                >
                  <Layout className="h-3 w-3" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="text-white hover:bg-white/10 h-8 w-8 rounded-md"
                title="Recording Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>

              <KeyboardShortcutsLegend />
            </div>
          </div>
        </div>
      </div>

      <RecordingSettings
        resolution={resolution}
        setResolution={setResolution}
        layout={layout}
        setLayout={setLayout}
        backgroundBlur={backgroundBlur}
        setBackgroundBlur={setBackgroundBlur}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  )
} 