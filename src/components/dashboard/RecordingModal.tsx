'use client'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { VideoRecordingFlow } from '@/components/video/VideoRecordingFlow'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  weekId: string
  onComplete?: () => void
}

export function RecordingModal({ isOpen, onClose, weekId, onComplete }: RecordingModalProps) {
  const handleClose = () => {
    onClose()
    onComplete?.()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="relative border-b border-gray-100 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Record Weekly Update
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <VideoRecordingFlow
                    weekId={weekId}
                    onComplete={handleClose}
                    onCancel={onClose}
                  />
                </div>

                {/* Footer - Optional status or help text */}
                <div className="bg-gray-50 px-6 py-3">
                  <p className="text-sm text-gray-500">
                    Your video will be processed and available in your library shortly after recording.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
