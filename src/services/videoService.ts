import { storage } from '@/lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { auth } from '@/lib/firebase'

export interface VideoMetadata {
  duration: string
  size: number
  type: string
  timestamp: string
  chapters?: Array<{
    time: number
    title: string
  }>
  transcript?: string
  summary?: string
  aiEnhanced: boolean
  quality: string
  layout: string
}

export interface UploadProgress {
  progress: number
  bytesTransferred: number
  totalBytes: number
}

export interface VideoUpload {
  id: string
  url: string
  metadata: VideoMetadata
  thumbnailUrl?: string
}

export class VideoService {
  private static generateVideoId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  static async uploadVideo(
    blob: Blob,
    metadata: VideoMetadata,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoUpload> {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('User must be authenticated to upload videos')

    const videoId = this.generateVideoId()
    const videoRef = ref(storage, `videos/${userId}/${videoId}`)
    
    // Create upload task
    const uploadTask = uploadBytesResumable(videoRef, blob, {
      contentType: metadata.type,
      customMetadata: {
        duration: metadata.duration,
        quality: metadata.quality,
        layout: metadata.layout,
        aiEnhanced: metadata.aiEnhanced.toString(),
        timestamp: metadata.timestamp
      }
    })

    // Handle progress updates
    uploadTask.on('state_changed',
      (snapshot) => {
        if (onProgress) {
          onProgress({
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes
          })
        }
      },
      (error) => {
        console.error('Upload error:', error)
        throw error
      }
    )

    // Wait for upload to complete
    await uploadTask

    // Get download URL
    const url = await getDownloadURL(videoRef)

    // TODO: Generate thumbnail (could be done with Cloud Function)
    // const thumbnailUrl = await this.generateThumbnail(url)

    return {
      id: videoId,
      url,
      metadata,
      // thumbnailUrl
    }
  }

  static async deleteVideo(videoId: string): Promise<void> {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('User must be authenticated to delete videos')

    const videoRef = ref(storage, `videos/${userId}/${videoId}`)
    await deleteObject(videoRef)
  }

  static async getVideoUrl(videoId: string): Promise<string> {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('User must be authenticated to access videos')

    const videoRef = ref(storage, `videos/${userId}/${videoId}`)
    return await getDownloadURL(videoRef)
  }

  // Helper method to generate video thumbnail (to be implemented)
  private static async generateThumbnail(videoUrl: string): Promise<string> {
    // TODO: Implement thumbnail generation
    // Could be done client-side using canvas or server-side using Cloud Functions
    return ''
  }
} 