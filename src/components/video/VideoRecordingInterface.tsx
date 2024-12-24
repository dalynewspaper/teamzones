'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { VideoRecordIcon, ComputerIcon } from '@/components/ui/icons'
import { VideoRecordingControls } from './VideoRecordingControls'

interface VideoRecordingInterfaceProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}

export function VideoRecordingInterface({ 
  onRecordingComplete, 
  onCancel,
}: VideoRecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [mode, setMode] = useState<'camera' | 'screen'>('camera')
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startMediaStream = async (type: 'camera' | 'screen') => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const mediaStream = await (type === 'camera' 
        ? navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        : navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      )
      
      setStream(mediaStream)
      setMode(type)
      setError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Failed to access media devices:', err)
      setError('Failed to access camera/microphone. Please check permissions.')
    }
  }

  const startRecording = () => {
    if (!stream) return

    const mediaRecorder = new MediaRecorder(stream)
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

    mediaRecorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <div className="space-y-4">
      {error && (
        <Alert type="error">
          {error}
        </Alert>
      )}

      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Select a recording option to begin
          </div>
        )}
        
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording</span>
          </div>
        )}
      </div>

      <VideoRecordingControls 
        isRecording={isRecording}
        hasStream={!!stream}
        mode={mode}
        onStartCamera={() => startMediaStream('camera')}
        onStartScreen={() => startMediaStream('screen')}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onCancel={onCancel}
      />
    </div>
  )
} 