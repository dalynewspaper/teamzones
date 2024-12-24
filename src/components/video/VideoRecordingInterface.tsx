'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { formatTime } from '@/lib/utils'
import { Settings2, Video, Monitor, Pause, Play, StopCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface VideoDevice {
  deviceId: string
  label: string
}

interface AudioDevice {
  deviceId: string
  label: string
}

interface Resolution {
  width: number
  height: number
  label: string
}

const RESOLUTIONS: Resolution[] = [
  { width: 1280, height: 720, label: '720p' },
  { width: 1920, height: 1080, label: '1080p' },
]

export function VideoRecordingInterface({ 
  onRecordingComplete,
  onCancel 
}: {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([])
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [selectedAudio, setSelectedAudio] = useState<string>('')
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(RESOLUTIONS[0])
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()

  // Load available devices
  useEffect(() => {
    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
        setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
        
        // Set defaults
        const defaultVideo = devices.find(d => d.kind === 'videoinput')
        const defaultAudio = devices.find(d => d.kind === 'audioinput')
        if (defaultVideo) setSelectedVideo(defaultVideo.deviceId)
        if (defaultAudio) setSelectedAudio(defaultAudio.deviceId)
      } catch (err) {
        console.error('Error loading devices:', err)
      }
    }
    loadDevices()
  }, [])

  // Start/stop stream based on device selection
  useEffect(() => {
    async function setupStream() {
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedVideo,
            width: selectedResolution.width,
            height: selectedResolution.height
          },
          audio: {
            deviceId: selectedAudio
          }
        })

        setStream(newStream)
        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }
      } catch (err) {
        console.error('Error setting up stream:', err)
      }
    }

    if (selectedVideo && selectedAudio) {
      setupStream()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [selectedVideo, selectedAudio, selectedResolution])

  const startRecording = async () => {
    if (!stream) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream)
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      onRecordingComplete(blob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
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

  const toggleScreenShare = async () => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        }).catch(err => {
          // Handle user cancellation
          if (err.name === 'NotAllowedError') {
            return null;
          }
          throw err;
        });

        // If user cancelled, return early
        if (!screenStream) return;

        // Add audio track if not present
        if (!screenStream.getAudioTracks().length) {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: selectedAudio }
          })
          screenStream.addTrack(audioStream.getAudioTracks()[0])
        }

        setStream(screenStream)
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream
        }
      } else {
        // Return to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedVideo,
            width: selectedResolution.width,
            height: selectedResolution.height
          },
          audio: { deviceId: selectedAudio }
        })
        setStream(cameraStream)
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream
        }
      }
      setIsScreenSharing(!isScreenSharing)
    } catch (err) {
      console.error('Error toggling screen share:', err)
      // Don't toggle if there was an error
      return;
    }
  }

  // Timer logic
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

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    'r': {
      action: () => !isRecording && startRecording(),
      description: 'Start recording'
    },
    'space': {
      action: () => isRecording && togglePause(),
      description: 'Pause/Resume recording'
    },
    'esc': {
      action: () => isRecording && stopRecording(),
      description: 'Stop recording'
    },
    's': {
      action: () => !isRecording && toggleScreenShare(),
      description: 'Toggle screen sharing'
    }
  });

  return (
    <div className="space-y-4" role="region" aria-label="Video recording interface">
      {/* Main Preview */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full text-white">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Source Selection */}
        {!isRecording && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
            <Button
              variant="default"
              onClick={() => toggleScreenShare()}
              type="button"
              className={`flex items-center gap-2 ${
                !isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Video className="w-4 h-4" />
              Camera
            </Button>
            <Button
              variant="default"
              onClick={() => toggleScreenShare()}
              className={`flex items-center gap-2 ${
                isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Screen
            </Button>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <Button onClick={startRecording} size="lg" className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Start Recording
            </Button>
          ) : (
            <>
              <Button onClick={togglePause} variant="ghost" className="flex items-center gap-2">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button onClick={stopRecording} variant="ghost" className="flex items-center gap-2">
                <StopCircle className="w-4 h-4" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Settings Sheet */}
        <Sheet>
          <SheetTrigger>
            <Button variant="ghost" size="sm" type="button">
              <Settings2 className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Recording Settings</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Camera</label>
                <Select
                  value={selectedVideo}
                  onChange={(e) => setSelectedVideo(e.target.value)}
                  disabled={isRecording}
                >
                  {videoDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId}`}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Microphone</label>
                <Select
                  value={selectedAudio}
                  onChange={(e) => setSelectedAudio(e.target.value)}
                  disabled={isRecording}
                >
                  {audioDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId}`}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quality</label>
                <Select
                  value={`${selectedResolution.width}x${selectedResolution.height}`}
                  onChange={(e) => {
                    const [width, height] = e.target.value.split('x').map(Number)
                    setSelectedResolution({ width, height, label: e.target.value })
                  }}
                  disabled={isRecording}
                >
                  {RESOLUTIONS.map(res => (
                    <option key={res.label} value={`${res.width}x${res.height}`}>
                      {res.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="text-xs text-gray-500 flex items-center gap-4 justify-center">
        <span>Press R to record</span>
        <span>Space to pause</span>
        <span>Esc to stop</span>
      </div>
    </div>
  )
} 