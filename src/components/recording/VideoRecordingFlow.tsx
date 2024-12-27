'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { VideoRecordingInterface } from '@/components/video/VideoRecordingInterface'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface VideoRecordingFlowProps {
  weekId?: string
  onComplete: () => void
  onCancel: () => void
  initialLayout?: 'camera' | 'screen' | 'pip'
  initialQuality?: '720p' | '1080p'
}

export function VideoRecordingFlow({ 
  weekId, 
  onComplete, 
  onCancel,
  initialLayout = 'camera',
  initialQuality = '1080p'
}: VideoRecordingFlowProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(true)

  const handleRecordingComplete = async (blob: Blob) => {
    try {
      console.log('Recording completed:', blob)
      toast({
        title: 'Recording completed',
        description: 'Your video has been saved successfully.',
        duration: 3000
      })
      setIsOpen(false)
      onComplete()
    } catch (error) {
      console.error('Error handling recording:', error)
      toast({
        title: 'Error',
        description: 'Failed to save recording. Please try again.',
        variant: 'destructive',
        duration: 5000
      })
    }
  }

  const handleError = (message: string) => {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
      duration: 5000
    })
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      onCancel()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90%] w-[1200px] h-[80vh] p-0">
        <div className="h-full flex flex-col p-6">
          <div className="flex-none space-y-2">
            <h2 className="text-2xl font-semibold">Record Update</h2>
            <p className="text-gray-600">Share an update with your team</p>
          </div>
          <div className="flex-1 overflow-hidden mt-6">
            <VideoRecordingInterface
              onRecordingComplete={handleRecordingComplete}
              onCancel={() => handleOpenChange(false)}
              onError={handleError}
              initialLayout={initialLayout}
              initialQuality={initialQuality}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 