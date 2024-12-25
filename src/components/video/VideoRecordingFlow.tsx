'use client'
import { useState } from 'react'
import { VideoRecordingInterface } from './VideoRecordingInterface'
import { useWeek } from '@/contexts/WeekContext'
import { storage, db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/AuthContext'

interface VideoRecordingFlowProps {
  weekId: string
  onComplete: () => void
  onCancel: () => void
}

export function VideoRecordingFlow({ weekId, onComplete, onCancel }: VideoRecordingFlowProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { refreshWeek } = useWeek()
  const { user } = useAuth()

  const handleRecordingComplete = async (blob: Blob) => {
    if (!user) return
    
    try {
      setIsUploading(true)
      
      const videoId = uuidv4()
      const storageRef = ref(storage, `videos/${user.uid}/${weekId}/${videoId}.webm`)
      await uploadBytes(storageRef, blob)
      const url = await getDownloadURL(storageRef)

      const weekRef = doc(db, 'weeks', weekId)
      await updateDoc(weekRef, {
        videos: arrayUnion({
          id: videoId,
          url,
          createdAt: new Date().toISOString(),
          status: 'ready',
          weekId,
          userId: user.uid,
          duration: 0
        }),
        updatedAt: new Date().toISOString()
      })

      await refreshWeek()
      onComplete()
    } catch (error) {
      console.error('Error uploading video:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {isUploading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Uploading your video...</p>
        </div>
      ) : (
        <VideoRecordingInterface
          onRecordingComplete={handleRecordingComplete}
          onCancel={onCancel}
        />
      )}
    </div>
  )
}