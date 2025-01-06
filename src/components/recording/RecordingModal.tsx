import { useState, useRef, useCallback } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { TeamSelector } from './TeamSelector'
import { uploadVideo } from '@/services/videoService'
import { Week, Video } from '@/types/firestore'

interface RecordingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (video: Video) => void
  currentWeek: Week
}

export function RecordingModal({ 
  open, 
  onOpenChange, 
  onSave,
  currentWeek 
}: RecordingModalProps) {
  const { user } = useAuth()
  const [selectedTeamId, setSelectedTeamId] = useState<string>()
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setVideoBlob(blob)
        
        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = URL.createObjectURL(blob)
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please check your camera permissions.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }, [recording])

  const handleSave = async () => {
    if (!videoBlob || !user?.uid || !selectedTeamId) return
    
    setIsSaving(true)
    try {
      await uploadVideo(
        videoBlob,
        currentWeek.id,
        (progress) => {
          console.log('Upload progress:', progress)
        }
      )
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving video:', error)
      setError('Failed to save video. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    // Stop recording if active
    if (recording) {
      stopRecording()
    }
    
    // Clear video blob and reset state
    setVideoBlob(null)
    setError(null)
    
    // Stop and remove media stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Record Update</DialogTitle>
            <TeamSelector 
              selectedTeamId={selectedTeamId}
              onTeamSelect={setSelectedTeamId}
            />
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex justify-center gap-4">
            {!recording && !videoBlob && (
              <Button
                onClick={startRecording}
                disabled={!selectedTeamId}
              >
                Start Recording
              </Button>
            )}

            {recording && (
              <Button
                variant="outline"
                onClick={stopRecording}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Stop Recording
              </Button>
            )}

            {videoBlob && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setVideoBlob(null)
                    if (videoRef.current) {
                      videoRef.current.src = ''
                    }
                  }}
                >
                  Record Again
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Update'}
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md">
              <div className="flex gap-2 items-center">
                <X className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 