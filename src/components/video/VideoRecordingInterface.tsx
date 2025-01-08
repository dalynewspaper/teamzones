'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useToast } from '@/components/ui/use-toast'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Square, Circle, Settings, Play, Pause, Mic, MicOff, Volume2, VolumeX, Camera, Monitor, Layout, Wand2, Clock, Hash, RotateCcw, Check, X, Maximize2 } from 'lucide-react'
import { VideoRecorder } from './VideoRecorder'
import { RecordingSettings } from './RecordingSettings'
import { KeyboardShortcutsLegend } from './KeyboardShortcutsLegend'
import { formatTime } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { VideoService, type UploadProgress } from '@/services/videoService'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
      chapters?: Array<{
        time: number;
        title: string;
      }>;
      transcript?: string;
      summary?: string;
      aiEnhanced: boolean;
      quality: string;
      layout: string;
    }
  }) => void;
  onCancel: () => void;
  onError?: (error: string) => void;
  initialLayout?: 'camera' | 'screen' | 'pip';
  initialQuality?: '720p' | '1080p' | '4k';
  initialAudioSource?: 'mic' | 'system' | 'both';
  maxDuration?: number; // in seconds
}

export function VideoRecordingInterface({
  onRecordingComplete,
  onCancel,
  onError,
  initialLayout = 'camera',
  initialQuality = '1080p',
  initialAudioSource = 'both',
  maxDuration = 300
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
  const [isAIEnabled, setIsAIEnabled] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [countdownSeconds, setCountdownSeconds] = useState(3)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [recordingChunks, setRecordingChunks] = useState<Blob[]>([])
  const uploadProgressRef = useRef(0)
  const [isReviewing, setIsReviewing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const recordingBlobRef = useRef<Blob | null>(null)
  const recordingMetadataRef = useRef<any>(null)
  const [recordingMode, setRecordingMode] = useState<'camera' | 'screen'>(initialLayout === 'screen' ? 'screen' : 'camera')
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  // Countdown timer effect
  useEffect(() => {
    if (isCountingDown && countdownSeconds > 0) {
      const timer = setTimeout(() => {
        setCountdownSeconds(prev => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (isCountingDown && countdownSeconds === 0) {
      setIsCountingDown(false)
      setCountdownSeconds(3)
      startRecording()
    }
  }, [isCountingDown, countdownSeconds])

  // Max duration warning
  useEffect(() => {
    if (isRecording && !isPaused && elapsedTime >= maxDuration - 30) {
      toast({
        title: 'Recording time limit approaching',
        description: `You have ${maxDuration - elapsedTime} seconds remaining`,
        duration: 4000
      })
    }

    if (isRecording && elapsedTime >= maxDuration) {
      stopRecording()
      toast({
        title: 'Maximum recording duration reached',
        description: 'Your recording has been automatically stopped',
        duration: 4000
      })
    }
  }, [isRecording, isPaused, elapsedTime, maxDuration])

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

  const processRecording = async (blob: Blob): Promise<{
    blob: Blob,
    metadata: any
  }> => {
    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      // Simulate AI processing with progress updates
      for (let i = 0; i < 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setProcessingProgress(i)
      }

      // TODO: Implement actual AI processing here
      // - Speech-to-text transcription
      // - Chapter detection
      // - Summary generation
      // - Smart compression

      const metadata = {
        duration: formatTime(elapsedTime),
        size: blob.size,
        type: blob.type,
        timestamp: new Date().toISOString(),
        aiEnhanced: isAIEnabled,
        quality: resolution,
        layout: layout,
        // Placeholder AI features (to be implemented)
        chapters: [
          { time: 0, title: 'Introduction' },
          { time: Math.floor(elapsedTime / 2), title: 'Main Points' },
          { time: elapsedTime - 30, title: 'Conclusion' }
        ],
        transcript: 'Transcript will be generated here...',
        summary: 'AI-generated summary will appear here...'
      }

      setProcessingProgress(100)
      return { blob, metadata }
    } catch (error) {
      console.error('Processing error:', error)
      throw new Error('Failed to process recording')
    } finally {
      setIsProcessing(false)
    }
  }

  const startRecordingWithCountdown = () => {
    setIsCountingDown(true)
  }

  // Modify startRecording function
  const startRecording = async () => {
    try {
      // Stop any existing streams first
      stopStream()
      
      let finalStream: MediaStream | null = null;

      if (recordingMode === 'camera') {
        // Get camera stream
        const constraints: MediaStreamConstraints = {
          video: {
            ...getResolutionConstraints(),
            deviceId: selectedDeviceId,
            facingMode: 'user'
          },
          audio: isMicEnabled
        }

        try {
          finalStream = await navigator.mediaDevices.getUserMedia(constraints)
        } catch (err) {
          console.error('Camera access error:', err)
          setError('Failed to access camera. Please check permissions.')
          onError?.('Camera access failed')
          return
        }
      } else {
        // Get screen stream
        try {
          // @ts-ignore - TypeScript doesn't know about getDisplayMedia options
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              ...getResolutionConstraints(),
              frameRate: resolution === '4k' ? 30 : 60
            },
            audio: isSystemAudioEnabled
          });

          // If mic is enabled, get mic stream and combine with screen stream
          if (isMicEnabled) {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false
            });
            
            // Combine screen and mic streams
            const tracks = [
              ...screenStream.getVideoTracks(),
              ...micStream.getAudioTracks()
            ];
            
            if (isSystemAudioEnabled) {
              tracks.push(...screenStream.getAudioTracks());
            }
            
            finalStream = new MediaStream(tracks);

            // Handle screen share being stopped by user
            screenStream.getVideoTracks()[0].onended = () => {
              stopRecording();
              setError('Screen sharing was stopped');
              onError?.('Screen sharing stopped');
            };
          } else {
            finalStream = screenStream;
          }
        } catch (err) {
          console.error('Screen sharing error:', err)
          setError('Failed to start screen sharing')
          onError?.('Screen sharing failed')
          return
        }
      }

      if (!finalStream) {
        throw new Error('No stream available')
      }

      setStream(finalStream)
      
      // Set up MediaRecorder with optimal settings
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'

      const options = {
        mimeType,
        videoBitsPerSecond: resolution === '4k' ? 8000000 : 4000000,
        audioBitsPerSecond: 128000
      }

      mediaRecorderRef.current = new MediaRecorder(finalStream, options)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          setRecordingChunks([...chunksRef.current])
          
          // Progress upload simulation
          uploadProgressRef.current += (100 / (maxDuration / 5)) // Update every 5 seconds
        }
      }

      mediaRecorderRef.current.start(5000) // Capture in 5-second chunks
      setIsRecording(true)
      setElapsedTime(0)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please try again.')
      onError?.('Recording setup failed')
      stopStream()
    }
  }

  // Modify existing stopRecording function
  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return

    mediaRecorderRef.current.stop()
    setIsRecording(false)
    setIsPaused(false)

    const finalBlob = new Blob(chunksRef.current, { type: 'video/webm' })
    try {
      const processed = await processRecording(finalBlob)
      // Instead of completing immediately, store the blob and metadata for review
      recordingBlobRef.current = processed.blob
      recordingMetadataRef.current = processed.metadata
      const url = URL.createObjectURL(processed.blob)
      setPreviewUrl(url)
      setIsReviewing(true)
    } catch (error) {
      console.error('Processing error:', error)
      onError?.('Failed to process recording')
    }

    chunksRef.current = []
    setRecordingChunks([])
    uploadProgressRef.current = 0
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

  const handleAcceptRecording = async () => {
    if (recordingBlobRef.current && recordingMetadataRef.current) {
      try {
        setIsProcessing(true)
        setProcessingProgress(0)

        const upload = await VideoService.uploadVideo(
          recordingBlobRef.current,
          recordingMetadataRef.current,
          (progress: UploadProgress) => {
            setProcessingProgress(progress.progress)
          }
        )

        onRecordingComplete({
          blob: recordingBlobRef.current,
          metadata: {
            ...recordingMetadataRef.current,
            url: upload.url,
            id: upload.id
          }
        })
      } catch (error) {
        console.error('Upload error:', error)
        onError?.('Failed to upload recording')
        toast({
          title: 'Upload Failed',
          description: 'There was an error uploading your recording. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsProcessing(false)
        cleanupPreview()
      }
    }
  }

  const handleRetakeRecording = () => {
    cleanupPreview()
    startRecordingWithCountdown()
  }

  const handleCancelReview = () => {
    cleanupPreview()
    onCancel()
  }

  const cleanupPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setIsReviewing(false)
    recordingBlobRef.current = null
    recordingMetadataRef.current = null
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupPreview()
      stopStream()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  // Add keyboard shortcuts
  useHotkeys('space', (event) => {
    event.preventDefault()
    if (isRecording) {
      togglePause()
    } else {
      startRecordingWithCountdown()
    }
  }, [isRecording, togglePause, startRecordingWithCountdown])

  useHotkeys('esc', () => {
    if (isRecording) {
      stopRecording()
    }
  }, [isRecording, stopRecording])

  useHotkeys('m', () => {
    setIsMicEnabled(prev => !prev)
  }, [])

  useHotkeys('b', () => {
    if (recordingMode === 'camera') {
      setBackgroundBlur(prev => !prev)
    }
  }, [recordingMode])

  useHotkeys('f', toggleFullscreen, [toggleFullscreen])

  // Modify recording mode switch to properly handle stream changes
  const handleRecordingModeChange = async () => {
    const newMode = recordingMode === 'camera' ? 'screen' : 'camera'
    
    // Stop current stream
    stopStream()

    try {
      if (newMode === 'camera') {
        const constraints: MediaStreamConstraints = {
          video: {
            ...getResolutionConstraints(),
            deviceId: selectedDeviceId,
            facingMode: 'user'
          },
          audio: isMicEnabled
        }
        const videoStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(videoStream)
      } else {
        // @ts-ignore - TypeScript doesn't know about getDisplayMedia options
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            ...getResolutionConstraints(),
            frameRate: resolution === '4k' ? 30 : 60
          },
          audio: isSystemAudioEnabled
        })
        setStream(screenStream)

        // Handle user cancelling screen share
        screenStream.getVideoTracks()[0].onended = () => {
          handleRecordingModeChange() // Switch back to camera
        }
      }
      setRecordingMode(newMode)
    } catch (error) {
      console.error('Error switching recording mode:', error)
      // If screen sharing fails, stay in camera mode
      if (newMode === 'screen') {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...getResolutionConstraints(),
            deviceId: selectedDeviceId,
            facingMode: 'user'
          },
          audio: isMicEnabled
        })
        setStream(cameraStream)
        toast({
          title: "Screen sharing failed",
          description: "Falling back to camera mode",
          variant: "destructive"
        })
      }
    }
  }

  if (isReviewing && previewUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
          <video
            ref={previewVideoRef}
            src={previewUrl}
            className="w-full h-full"
            controls
            autoPlay
          />
          
          {/* Add upload progress overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <div className="text-white mb-4">Uploading your recording...</div>
              <Progress value={processingProgress} className="w-64 h-2" />
              <div className="text-white/70 text-sm mt-2">
                {Math.round(processingProgress)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4 space-x-4">
          <div className="text-sm text-muted-foreground">
            Review your recording before finalizing
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleRetakeRecording}
              className="space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancelReview}
              className="space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
            
            <Button
              variant="default"
              onClick={handleAcceptRecording}
              className="space-x-2 bg-green-500 hover:bg-green-600"
            >
              <Check className="w-4 h-4" />
              <span>Accept & Continue</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Main Preview Area */}
      <div className="relative flex-1 min-h-0 bg-black rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {error && (
            <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-50">
              {error}
            </Alert>
          )}

          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-7xl font-bold text-white animate-pulse">
                {countdownSeconds}
              </div>
            </div>
          )}

          <div className="relative w-full h-full">
            <VideoRecorder
              stream={stream}
              isRecording={isRecording}
              backgroundBlur={backgroundBlur && recordingMode === 'camera'}
            />
          </div>
        </div>

        {/* Recording Progress Overlay */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between text-white mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-lg font-medium">{formatTime(elapsedTime)}</span>
                <span className="text-sm opacity-80">
                  ({formatTime(maxDuration - elapsedTime)} remaining)
                </span>
              </div>
            </div>
            <Progress value={(elapsedTime / maxDuration) * 100} className="h-1" />
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="text-xl font-medium text-white mb-4">
              Enhancing your recording...
            </div>
            <div className="w-64">
              <Progress value={processingProgress} className="h-2" />
              <div className="text-sm text-white/70 text-center mt-2">
                {Math.round(processingProgress)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="flex-none mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecordingWithCountdown}
                  className="bg-red-500 hover:bg-red-600 text-white gap-2"
                >
                  <Circle className="w-4 h-4" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={togglePause}
                    className="gap-2"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={stopRecording}
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop Recording
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRecordingModeChange}
                      className="h-10 w-10"
                    >
                      {recordingMode === 'camera' ? (
                        <Camera className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Switch to {recordingMode === 'camera' ? 'screen' : 'camera'} recording (Alt+S)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMicEnabled(!isMicEnabled)}
                      className={`h-10 w-10 ${!isMicEnabled ? 'text-red-500' : ''}`}
                    >
                      {isMicEnabled ? (
                        <Mic className="w-5 h-5" />
                      ) : (
                        <MicOff className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isMicEnabled ? 'Disable' : 'Enable'} microphone (M)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSystemAudioEnabled(!isSystemAudioEnabled)}
                      className={`h-10 w-10 ${!isSystemAudioEnabled ? 'text-red-500' : ''}`}
                      disabled={recordingMode === 'camera'}
                    >
                      {isSystemAudioEnabled ? (
                        <Volume2 className="w-5 h-5" />
                      ) : (
                        <VolumeX className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isSystemAudioEnabled ? 'Disable' : 'Enable'} system audio
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {recordingMode === 'camera' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBackgroundBlur(!backgroundBlur)}
                        className={`h-10 w-10 ${backgroundBlur ? 'text-purple-500' : ''}`}
                      >
                        <Wand2 className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {backgroundBlur ? 'Disable' : 'Enable'} background blur (B)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <div className="h-6 w-px bg-gray-200" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSettingsOpen(true)}
                      className="h-10 w-10"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Recording settings (S)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={toggleFullscreen}
                    >
                      <Maximize2 className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Toggle fullscreen (F)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Keyboard Shortcuts Legend */}
          <div className="text-xs text-gray-500 flex items-center justify-center space-x-4">
            <span>Space: {isRecording ? 'Pause/Resume' : 'Start'}</span>
            <span>Esc: Stop</span>
            <span>M: Toggle Mic</span>
            <span>B: Toggle Blur</span>
            <span>F: Fullscreen</span>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <RecordingSettings
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
        resolution={resolution}
        setResolution={setResolution}
        layout={layout}
        setLayout={setLayout}
        backgroundBlur={backgroundBlur}
        setBackgroundBlur={setBackgroundBlur}
      />
    </div>
  )
} 