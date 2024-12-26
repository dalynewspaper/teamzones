'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface VideoRecordingFlowProps {
  weekId?: string
  onComplete: () => void
  onCancel: () => void
}

export function VideoRecordingFlow({ weekId, onComplete, onCancel }: VideoRecordingFlowProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      // Cleanup media stream when component unmounts
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mediaStream])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setMediaStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        
        // Here you would typically upload the blob to your storage service
        // For now, we'll just simulate completion
        console.log('Recording completed:', blob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        setMediaStream(null)
        
        // Call onComplete callback
        onComplete()
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please check your camera and microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-lg bg-gray-100 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="space-x-2">
          {!isRecording ? (
            <Button onClick={startRecording}>
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="outline">
              Stop Recording
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
} 