'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { RecordingSettings } from './VideoRecorderSettings'

interface TestModeProps {
  settings: RecordingSettings
  onClose: () => void
}

export function TestMode({ settings, onClose }: TestModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()

  // Define checkAudio function outside useEffect
  const checkAudio = () => {
    if (!analyzerRef.current) return
    
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
    analyzerRef.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setAudioLevel(average)
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
            deviceId: settings.audioDeviceId
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }

        // Setup audio monitoring
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(mediaStream)
        const analyzer = audioContext.createAnalyser()
        analyzer.fftSize = 256
        source.connect(analyzer)
        analyzerRef.current = analyzer
        
        // Start audio monitoring
        checkAudio()
        setStream(mediaStream)

      } catch (error) {
        console.error('Error accessing media devices:', error)
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Test Your Setup</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Preview
          </label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio Level
          </label>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-150"
              style={{ width: `${(audioLevel / 255) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Speak to test your microphone
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
} 