'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatTime } from '@/lib/utils'
import { Settings2, Video, Monitor, Pause, Play, StopCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { RecordingSettings } from './RecordingSettings'
import { useRecordingShortcuts } from '@/hooks/useKeyboardShortcuts'
import { KeyboardShortcutsLegend } from './KeyboardShortcutsLegend'
import { Alert } from '@/components/ui/alert'

interface VideoDevice {
  deviceId: string
  label: string
}

interface VideoRecordingInterfaceProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
  onError?: (message: string) => void
  initialLayout?: 'camera' | 'screen' | 'pip'
  initialQuality?: '720p' | '1080p'
}

interface RecordingSettingsProps {
  resolution: 'standard' | 'high' | 'ultra'
  setResolution: (resolution: 'standard' | 'high' | 'ultra') => void
  layout: 'camera' | 'screen' | 'pip'
  setLayout: (layout: 'camera' | 'screen' | 'pip') => void
  backgroundBlur: boolean
  setBackgroundBlur: (backgroundBlur: boolean) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoRecordingInterface({ 
  onRecordingComplete, 
  onCancel, 
  onError,
  initialLayout = 'camera',
  initialQuality = '1080p'
}: VideoRecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [devices, setDevices] = useState<VideoDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [layout, setLayout] = useState<'camera' | 'screen' | 'pip'>(initialLayout)
  const [quality, setQuality] = useState<'720p' | '1080p'>(initialQuality)
  const [backgroundBlur, setBackgroundBlur] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermissions, setHasPermissions] = useState(false)
  const [audioSource, setAudioSource] = useState<'microphone' | 'system' | 'both'>('both')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const pipVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    checkPermissions()
    return () => {
      stopStream()
    }
  }, [])

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setHasPermissions(true)
      await loadDevices()
    } catch (err) {
      console.error('Permission error:', err)
      const message = 'Camera access is required. Please allow access in your browser settings.'
      setError(message)
      onError?.(message)
      setHasPermissions(false)
    }
  }

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
      } else {
        const message = 'No video devices found'
        setError(message)
        onError?.(message)
      }
    } catch (error) {
      console.error('Error loading devices:', error)
      const message = 'Failed to load video devices'
      setError(message)
      onError?.(message)
    }
  }

  const getVideoConstraints = () => {
    const constraints: MediaTrackConstraints = {
      deviceId: selectedDeviceId
    }

    switch (quality) {
      case '1080p':
        constraints.width = 1920
        constraints.height = 1080
        break
      case '720p':
        constraints.width = 1280
        constraints.height = 720
        break
    }

    return constraints
  }

  const startRecording = async () => {
    try {
      setError(null)
      setIsProcessing(true)
      let finalStream: MediaStream | null = null

      if (isScreenSharing) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: {
              displaySurface: 'monitor'
            },
            audio: audioSource === 'system' || audioSource === 'both'
          })
          screenStreamRef.current = screenStream

          if (layout === 'pip') {
            const cameraStream = await navigator.mediaDevices.getUserMedia({
              video: getVideoConstraints(),
              audio: audioSource === 'microphone' || audioSource === 'both'
            })
            cameraStreamRef.current = cameraStream

            // Combine streams for PiP
            finalStream = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...cameraStream.getVideoTracks(),
              ...(audioSource === 'both' ? [...screenStream.getAudioTracks(), ...cameraStream.getAudioTracks()] :
                  audioSource === 'system' ? screenStream.getAudioTracks() :
                  cameraStream.getAudioTracks())
            ])
          } else {
            finalStream = screenStream
          }
        } catch (err) {
          console.error('Screen sharing error:', err)
          const message = 'Failed to start screen sharing. Please try again.'
          setError(message)
          onError?.(message)
          setIsProcessing(false)
          return
        }
      } else {
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: getVideoConstraints(),
            audio: true
          })
          cameraStreamRef.current = cameraStream
          finalStream = cameraStream
        } catch (err) {
          console.error('Camera error:', err)
          const message = 'Failed to access camera. Please check your permissions.'
          setError(message)
          onError?.(message)
          setIsProcessing(false)
          return
        }
      }

      if (!finalStream) {
        throw new Error('Failed to create media stream')
      }

      streamRef.current = finalStream
      if (videoRef.current) {
        videoRef.current.srcObject = finalStream
      }

      // Set up PiP video if needed
      if (layout === 'pip' && pipVideoRef.current && cameraStreamRef.current) {
        pipVideoRef.current.srcObject = cameraStreamRef.current
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: quality === '1080p' ? 4000000 : 2500000
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
        setIsProcessing(false)
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        const message = 'An error occurred while recording'
        setError(message)
        onError?.(message)
        stopRecording()
        setIsProcessing(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setIsProcessing(false)
    } catch (error) {
      console.error('Error starting recording:', error)
      const message = 'Failed to start recording. Please try again.'
      setError(message)
      onError?.(message)
      setIsProcessing(false)
    }
  }

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        stopStream()
        setIsRecording(false)
        setIsPaused(false)
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      const message = 'Failed to stop recording properly'
      setError(message)
      onError?.(message)
    }
  }

  const togglePause = () => {
    try {
      if (mediaRecorderRef.current) {
        if (isPaused) {
          mediaRecorderRef.current.resume()
        } else {
          mediaRecorderRef.current.pause()
        }
        setIsPaused(!isPaused)
      }
    } catch (error) {
      console.error('Error toggling pause:', error)
      const message = 'Failed to pause/resume recording'
      setError(message)
      onError?.(message)
    }
  }

  const stopStream = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = null
    }
  }

  const toggleScreenShare = () => {
    if (!isRecording) {
      setIsScreenSharing(!isScreenSharing)
    }
  }

  const toggleBackgroundBlur = () => {
    setBackgroundBlur(!backgroundBlur)
  }

  const cycleLayout = () => {
    const layouts: Array<'camera' | 'screen' | 'pip'> = ['camera', 'screen', 'pip']
    const currentIndex = layouts.indexOf(layout)
    const nextIndex = (currentIndex + 1) % layouts.length
    setLayout(layouts[nextIndex])
  }

  useRecordingShortcuts({
    isRecording,
    startRecording,
    stopRecording,
    togglePause,
    toggleScreenShare,
    toggleBackgroundBlur,
    cycleLayout
  })

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording, isPaused])

  if (!hasPermissions) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          {error || 'Camera access is required'}
        </Alert>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={checkPermissions}>
            Request Permissions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {error && (
        <Alert variant="destructive" className="mb-4 flex-none">
          {error}
        </Alert>
      )}

      <div className="flex-1 relative rounded-xl bg-gray-900 overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-lg font-medium">{formatTime(recordingTime)}</span>
                </>
              ) : (
                <span className="text-lg">Ready to record</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {!isRecording && (
                <>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={toggleScreenShare}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    {isScreenSharing ? <Monitor className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <Settings2 className="w-5 h-5" />
                  </Button>

                  <KeyboardShortcutsLegend />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 flex-none">
        <Button size="lg" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="space-x-3">
          {isRecording ? (
            <>
              <Button
                size="lg"
                variant="ghost"
                onClick={togglePause}
                className="min-w-[140px]"
              >
                {isPaused ? <Play className="mr-2 w-5 h-5" /> : <Pause className="mr-2 w-5 h-5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                size="lg"
                variant="ghost"
                onClick={stopRecording}
                className="text-red-600 hover:text-red-700 min-w-[140px]"
              >
                <StopCircle className="mr-2 w-5 h-5" />
                Stop Recording
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={startRecording} className="min-w-[140px]">
              Start Recording
            </Button>
          )}
        </div>
      </div>

      <RecordingSettings
        resolution={quality}
        setResolution={setQuality}
        layout={layout}
        setLayout={setLayout}
        backgroundBlur={backgroundBlur}
        setBackgroundBlur={setBackgroundBlur}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  )
} 