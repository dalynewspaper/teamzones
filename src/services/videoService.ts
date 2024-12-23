import { storage, db } from '../lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import type { Video } from '../types/firestore'

interface UploadVideoParams {
  file: Blob
  userId: string
  weekId: string
  title: string
  visibility: 'team' | 'private'
  onProgress?: (progress: number) => void
}

export async function uploadVideo({
  file,
  userId,
  weekId,
  title,
  visibility,
  onProgress
}: UploadVideoParams): Promise<Video> {
  const videoId = crypto.randomUUID()
  const filename = `${Date.now()}-${videoId}.webm`
  const storageRef = ref(storage, `videos/${userId}/${videoId}/${filename}`)
  
  // Upload video file
  const uploadTask = uploadBytesResumable(storageRef, file)
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(progress)
      },
      (error) => {
        reject(error)
      },
      async () => {
        try {
          // Get video URL
          const videoUrl = await getDownloadURL(uploadTask.snapshot.ref)
          
          // Create video document
          const videoData: Omit<Video, 'id'> = {
            userId,
            title,
            videoUrl,
            weekId,
            visibility,
            processingStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          // Save to Firestore
          const videoRef = doc(collection(db, 'users', userId, 'videos'), videoId)
          await setDoc(videoRef, {
            ...videoData,
            id: videoId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          
          resolve({ ...videoData, id: videoId })
        } catch (error) {
          reject(error)
        }
      }
    )
  })
} 