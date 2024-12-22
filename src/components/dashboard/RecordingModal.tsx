'use client'
import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { Button } from '../ui/button'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecordingModal({ isOpen, onClose }: RecordingModalProps) {
  const [isRecording, setIsRecording] = useState(false)

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium">Record Update</Dialog.Title>
          
          <div className="mt-4">
            <Button 
              onClick={() => setIsRecording(!isRecording)}
              variant={isRecording ? 'secondary' : 'primary'}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
