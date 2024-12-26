'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useWeek } from '@/contexts/WeekContext'
import { VideoRecordingFlow } from '@/components/recording/VideoRecordingFlow'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  weekId?: string
}

export function RecordingModal({ isOpen, onClose, onComplete, weekId }: RecordingModalProps) {
  const { user } = useAuth()
  const { currentWeek } = useWeek()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)

      // Call onComplete callback if provided
      onComplete?.()
      
      // Close the modal
      onClose()
    } catch (err) {
      console.error('Error completing recording:', err)
      setError('Failed to save recording. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Clean up the URL by removing the record parameter
    const url = new URL(window.location.href)
    url.searchParams.delete('record')
    window.history.replaceState({}, '', url)
    
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Update</DialogTitle>
          <p className="text-sm text-gray-500">
            Share an update with your team
          </p>
        </DialogHeader>

        <VideoRecordingFlow
          weekId={weekId || currentWeek?.id}
          onComplete={handleComplete}
          onCancel={handleClose}
        />

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
