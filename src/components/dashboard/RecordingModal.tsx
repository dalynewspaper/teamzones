'use client'
import { Dialog } from '@headlessui/react'
import { VideoRecordingFlow } from '../video/VideoRecordingFlow'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  weekId: string
}

export function RecordingModal({ isOpen, onClose, weekId }: RecordingModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Record Weekly Update
          </Dialog.Title>
          
          <VideoRecordingFlow
            weekId={weekId}
            onComplete={onClose}
            onCancel={onClose}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
