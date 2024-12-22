import { db } from './firebase'
import { collection, addDoc } from 'firebase/firestore'

interface VideoMetadata {
  title: string
  url: string
  weekId: string
  isPublic: boolean
  createdAt: string
  userId: string
}

export async function addVideoToFirestore(video: VideoMetadata) {
  const videosRef = collection(db, 'videos')
  return addDoc(videosRef, video)
}