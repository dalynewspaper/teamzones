'use client'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { addVideoToFirestore } from '@/lib/firestore'
import type { Video } from '@/types/firestore'

interface VideoPublishFormProps {
  videoBlob: Blob
  onSuccess: () => void
  onCancel: () => void
  weekId: string
}

export function VideoPublishForm({ 
  videoBlob, 
  onSuccess, 
  onCancel,
  weekId 
}: VideoPublishFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [duration, setDuration] = useState<number>(0)

  useEffect(() => {
    const calculateDuration = async () => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      
      const durationPromise = new Promise<number>((resolve) => {
        video.onloadedmetadata = () => resolve(video.duration)
      })
      
      video.src = URL.createObjectURL(videoBlob)
      const videoDuration = await durationPromise
      setDuration(videoDuration)
      URL.revokeObjectURL(video.src)
    }

    calculateDuration()
  }, [videoBlob])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to publish videos')
      return
    }

    try {
      setIsUploading(true)
      setError('')

      const timestamp = Date.now()
      const videoPath = `videos/${user.uid}/${weekId}/${timestamp}.webm`
      const storageRef = ref(storage, videoPath)
      
      const metadata = {
        contentType: 'video/webm',
        customMetadata: {
          userId: user.uid,
          weekId,
          duration: duration.toString(),
          isPublic: isPublic.toString()
        }
      }
      
      const snapshot = await uploadBytes(storageRef, videoBlob, metadata)
      const downloadURL = await getDownloadURL(snapshot.ref)

      const now = new Date().toISOString()
      
      const videoData: Omit<Video, 'id'> = {
        title,
        url: downloadURL,
        weekId,
        isPublic,
        createdAt: now,
        updatedAt: now,
        userId: user.uid,
        duration,
        thumbnailUrl: '',
      }

      await addVideoToFirestore(videoData)
      onSuccess()
    } catch (err) {
      console.error('Failed to publish video:', err)
      setError('Failed to publish video. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label 
          htmlFor="title" 
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Weekly update for Team A"
          required
          disabled={isUploading}
        />
      </div>

      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isUploading}
          />
          <label 
            htmlFor="isPublic" 
            className="ml-2 block text-sm text-gray-700"
          >
            Make this video visible to the entire team
          </label>
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="relative h-2 bg-gray-200 rounded">
            <div
              className="absolute h-full bg-blue-600 rounded transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <div className="flex justify-end gap-4">
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
          disabled={isUploading || !title.trim()}
        >
          {isUploading ? 'Publishing...' : 'Publish Video'}
        </Button>
      </div>
    </form>
  )
} 