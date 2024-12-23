import { storage, db } from '@/lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { 
  doc, 
  setDoc, 
  collection, 
  serverTimestamp,
  Timestamp,
  FieldValue 
} from 'firebase/firestore'
import type { Video } from '@/types/firestore'

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
  
  try {
    const storageRef = ref(storage, `videos/${userId}/${videoId}/${filename}`)
    const uploadTask = uploadBytesResumable(storageRef, file)
    
    return new Promise<Video>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress?.(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          reject(error)
        },
        async () => {
          try {
            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref)
            
            const timestamp = serverTimestamp() as FieldValue
            
            const videoData = {
              id: videoId,
              userId,
              title,
              videoUrl,
              weekId,
              visibility,
              processingStatus: 'pending' as const,
              createdAt: timestamp,
              updatedAt: timestamp
            }
            
            const videoRef = doc(collection(db, 'users', userId, 'videos'), videoId)
            await setDoc(videoRef, videoData)
            
            resolve(videoData as Video)
          } catch (error) {
            console.error('Firestore error:', error)
            reject(error)
          }
        }
      )
    })
  } catch (error) {
    console.error('Upload initialization error:', error)
    throw error
  }
} 