'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadVideo } from '@/services/videoService'
import { Button } from '../ui/button'

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
    if (!user) return

    try {
      setIsUploading(true)
      setError(null)

      await uploadVideo({
        file: videoBlob,
        userId: user.uid,
        weekId,
        title,
        visibility,
        onProgress: setUploadProgress
      })

      onSuccess()
    } catch (err) {
      setError('Failed to upload video. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Visibility
        </label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'team' | 'private')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="team">Visible to team</option>
          <option value="private">Private</option>
        </select>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUploading || !title}
        >
          Publish
        </Button>
      </div>
    </form>
  )
} 