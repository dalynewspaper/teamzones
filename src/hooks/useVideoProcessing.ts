import { useState, useEffect } from 'react'
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Video } from '../types/firestore'

export function useVideoProcessing(userId: string, videoId: string) {
  const [status, setStatus] = useState<Video['processingStatus']>('pending')
  const [transcript, setTranscript] = useState<string>()
  const [summary, setSummary] = useState<string>()
  const [error, setError] = useState<string>()
  const [videoDoc, setVideoDoc] = useState<DocumentSnapshot>()

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId, 'videos', videoId),
      (doc) => {
        setVideoDoc(doc)
        const data = doc.data() as Video
        setStatus(data.processingStatus)
        setTranscript(data.transcript)
        setSummary(data.summary)
      },
      (error) => {
        console.error('Error monitoring video processing:', error)
        setError('Failed to monitor video processing status')
      }
    )

    return () => unsubscribe()
  }, [userId, videoId])

  return {
    status,
    transcript,
    summary,
    error,
    data: videoDoc?.data()
  }
} 