'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadVideo } from '@/services/videoService'

interface VideoPublishFormProps {
  videoBlob: Blob
  weekId: string
  onSuccess: () => void
  onCancel: () => void
}

export function VideoPublishForm({
  videoBlob,
  weekId,
  onSuccess,
  onCancel
}: VideoPublishFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState<'team' | 'private'>('team')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      await uploadVideo({
        file: videoBlob,
        userId: user.uid,
        weekId,
        title: title || `Weekly Update - ${new Date().toLocaleDateString()}`,
        visibility,
        onProgress: setUploadProgress
      })
      onSuccess()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload video')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Upload progress */}
      {isUploading && (
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-blue-600">
                Uploading... {Math.round(uploadProgress)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div 
              style={{ width: `${uploadProgress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
            />
          </div>
        </div>
      )}
      
      {/* Submit button */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Publish'}
        </button>
      </div>
    </form>
  )
} 