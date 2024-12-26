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
}

export function VideoRecordingInterface({ onRecordingComplete, onCancel, onError }: VideoRecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [devices, setDevices] = useState<VideoDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [layout, setLayout] = useState<'camera' | 'screen' | 'pip'>('camera')
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p')
  const [backgroundBlur, setBackgroundBlur] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermissions, setHasPermissions] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
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

  const startRecording = async () => {
    try {
      setError(null)
      let stream: MediaStream

      if (isScreenSharing) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: true
          })
        } catch (err) {
          console.error('Screen sharing error:', err)
          const message = 'Failed to start screen sharing. Please try again.'
          setError(message)
          onError?.(message)
          return
        }
        
        if (layout === 'pip') {
          try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: selectedDeviceId },
              audio: true
            })
            stream = new MediaStream([
              ...stream.getVideoTracks(),
              ...stream.getAudioTracks(),
              ...cameraStream.getVideoTracks(),
              ...cameraStream.getAudioTracks()
            ])
          } catch (err) {
            console.error('Camera error:', err)
            stream.getTracks().forEach(track => track.stop())
            const message = 'Failed to access camera for picture-in-picture mode'
            setError(message)
            onError?.(message)
            return
          }
        }
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedDeviceId },
            audio: true
          })
        } catch (err) {
          console.error('Camera error:', err)
          const message = 'Failed to access camera. Please check your permissions.'
          setError(message)
          onError?.(message)
          return
        }
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
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

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        const message = 'An error occurred while recording'
        setError(message)
        onError?.(message)
        stopRecording()
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error starting recording:', error)
      const message = 'Failed to start recording. Please try again.'
      setError(message)
      onError?.(message)
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const toggleScreenShare = () => {
    if (!isRecording) {
      setIsScreenSharing(!isScreenSharing)
    }
  }

  const getVideoConstraints = () => ({
    width: resolution === '1080p' ? 1920 : 1280,
    height: resolution === '1080p' ? 1080 : 720
  })

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
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="relative aspect-video rounded-lg bg-gray-900 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {isRecording ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>{formatTime(recordingTime)}</span>
                </>
              ) : (
                <span>Ready to record</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {!isRecording && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleScreenShare}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    {isScreenSharing ? <Monitor /> : <Video />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>

                  <KeyboardShortcutsLegend />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="space-x-2">
          {isRecording ? (
            <>
              <Button
                variant="ghost"
                onClick={togglePause}
              >
                {isPaused ? <Play className="mr-2" /> : <Pause className="mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={stopRecording}
                className="text-red-600 hover:text-red-700"
              >
                <StopCircle className="mr-2" />
                Stop Recording
              </Button>
            </>
          ) : (
            <Button onClick={startRecording}>
              Start Recording
            </Button>
          )}
        </div>
      </div>

      <RecordingSettings
        resolution={resolution}
        setResolution={setResolution}
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