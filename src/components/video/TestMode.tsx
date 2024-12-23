'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import {
  XMarkIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import type { RecordingSettings } from './VideoRecorderSettings'

interface TestModeProps {
  settings: RecordingSettings
  onClose: () => void
  onError: (msg: string) => void
}

interface TestStatus {
  video: 'testing' | 'success' | 'error'
  audio: 'testing' | 'success' | 'error'
  network: 'testing' | 'success' | 'error'
}

export function TestMode({ settings, onClose, onError }: TestModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const [status, setStatus] = useState<TestStatus>({
    video: 'testing',
    audio: 'testing',
    network: 'testing'
  })

  const checkAudio = () => {
    if (!analyzerRef.current) return
    
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
    analyzerRef.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setAudioLevel(average)
    
    // Update audio status based on levels
    if (average > 50) {
      setStatus(prev => ({ ...prev, audio: 'success' }))
    }
    
    animationFrameRef.current = requestAnimationFrame(checkAudio)
  }

  useEffect(() => {
    async function setupStream() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: settings.videoDeviceId,
            width: settings.resolution.width,
            height: settings.resolution.height
          },
          audio: {
            deviceId: settings.audioDeviceId,
            echoCancellation: true,
            noiseSuppression: true
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          setStatus(prev => ({ ...prev, video: 'success' }))
        }

        // Setup audio monitoring
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(mediaStream)
        const analyzer = audioContext.createAnalyser()
        analyzer.fftSize = 256
        source.connect(analyzer)
        analyzerRef.current = analyzer
        
        checkAudio()
        setStream(mediaStream)

        // Test network connection
        const testNetworkSpeed = async () => {
          try {
            const start = performance.now()
            await fetch('https://www.google.com/favicon.ico')
            const duration = performance.now() - start
            setStatus(prev => ({ 
              ...prev, 
              network: duration < 200 ? 'success' : 'error' 
            }))
          } catch {
            setStatus(prev => ({ ...prev, network: 'error' }))
          }
        }
        testNetworkSpeed()

      } catch (error) {
        console.error('Error accessing media devices:', error)
        onError('Failed to access media devices')
      }
    }

    setupStream()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [settings])

  const getStatusIcon = (status: 'testing' | 'success' | 'error') => {
    if (status === 'testing') {
      return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
    }
    if (status === 'success') {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />
    }
    return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Test Your Setup</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-8">
        {/* Video Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <VideoCameraIcon className="w-5 h-5 text-gray-500" />
              Camera Preview
            </label>
            {getStatusIcon(status.video)}
          </div>
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Audio Level */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MicrophoneIcon className="w-5 h-5 text-gray-500" />
              Audio Level
            </label>
            {getStatusIcon(status.audio)}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-150"
              style={{ width: `${(audioLevel / 255) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Speak to test your microphone
          </p>
        </div>

        {/* Network Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <SignalIcon className="w-5 h-5 text-gray-500" />
              Network Connection
            </label>
            {getStatusIcon(status.network)}
          </div>
          <p className="text-sm text-gray-500">
            {status.network === 'success' 
              ? 'Your connection is stable for video recording'
              : status.network === 'testing'
              ? 'Testing connection...'
              : 'Your connection might be unstable'
            }
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-8 pt-4 border-t">
        <Button onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
} 