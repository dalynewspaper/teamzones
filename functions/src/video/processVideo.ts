import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import ffmpeg from 'fluent-ffmpeg'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

const bucket = admin.storage().bucket()

interface VideoMetadata {
  duration: number
  thumbnailUrl: string
  status: 'processing' | 'ready' | 'error'
}

export const processVideo = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name
    if (!filePath?.startsWith('videos/') || !filePath.endsWith('.webm')) {
      return
    }

    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath))
    const thumbnailPath = path.join(os.tmpdir(), `thumb_${path.basename(filePath)}.jpg`)
    
    try {
      // Download video file
      await bucket.file(filePath).download({ destination: tempFilePath })
      
      // Generate thumbnail
      await generateThumbnail(tempFilePath, thumbnailPath)
      
      // Get video duration
      const duration = await getVideoDuration(tempFilePath)
      
      // Upload thumbnail
      const thumbnailFileName = `thumbnails/${path.basename(filePath)}.jpg`
      await bucket.upload(thumbnailPath, {
        destination: thumbnailFileName,
        metadata: {
          contentType: 'image/jpeg',
        },
      })
      
      // Get thumbnail URL
      const [thumbnailUrl] = await bucket
        .file(thumbnailFileName)
        .getSignedUrl({ action: 'read', expires: '03-01-2500' })
      
      // Update video metadata in Firestore
      const weekId = filePath.split('/')[1] // videos/{weekId}/{filename}
      await updateVideoMetadata(weekId, filePath, {
        duration,
        thumbnailUrl,
        status: 'ready'
      })

      // Cleanup
      fs.unlinkSync(tempFilePath)
      fs.unlinkSync(thumbnailPath)
    } catch (error) {
      console.error('Error processing video:', error)
      const weekId = filePath.split('/')[1]
      await updateVideoMetadata(weekId, filePath, {
        duration: 0,
        thumbnailUrl: '',
        status: 'error'
      })
    }
  })

async function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['50%'],
        filename: 'thumbnail.jpg',
        folder: path.dirname(thumbnailPath),
        size: '320x180'
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
  })
}

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err)
      resolve(metadata.format.duration || 0)
    })
  })
}

async function updateVideoMetadata(
  weekId: string,
  videoPath: string,
  metadata: VideoMetadata
): Promise<void> {
  const db = admin.firestore()
  const weekRef = db.collection('weeks').doc(weekId)
  
  const weekDoc = await weekRef.get()
  if (!weekDoc.exists) return

  const week = weekDoc.data()
  const videos = week?.videos || []
  
  // Find and update the video metadata
  const updatedVideos = videos.map((video: any) => {
    if (video.id === path.basename(videoPath)) {
      return { ...video, ...metadata }
    }
    return video
  })

  await weekRef.update({ videos: updatedVideos })
} 