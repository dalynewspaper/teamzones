import * as dotenv from 'dotenv'
dotenv.config()

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence'
import { google } from '@google-cloud/video-intelligence/build/protos/protos'
import OpenAI from 'openai'
import ffmpeg from 'fluent-ffmpeg'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { withCors } from './middleware/cors'

// Initialize Firebase Admin
admin.initializeApp()

// Initialize services
const videoIntelligence = new VideoIntelligenceServiceClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Wrap your function with CORS middleware
export const processVideo = withCors(
  functions.runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  }).storage.object().onFinalize(async (object) => {
    const filePath = object.name
    if (!filePath?.startsWith('videos/') || !filePath.endsWith('.webm')) {
      return
    }

    const gcsUri = `gs://${object.bucket}/${filePath}`
    const pathParts = filePath.split('/')
    const userId = pathParts[1]
    const videoId = pathParts[2]
    
    const videoRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('videos')
      .doc(videoId)

    try {
      await videoRef.update({ 
        processingStatus: 'processing',
        retryCount: 0
      })

      // Download video for thumbnail generation
      const tempFilePath = path.join(os.tmpdir(), path.basename(filePath))
      const bucket = admin.storage().bucket(object.bucket)
      await bucket.file(filePath).download({ destination: tempFilePath })

      // Generate thumbnail
      const thumbnailPath = await generateThumbnail(tempFilePath, videoId)
      const thumbnailFile = bucket.file(`thumbnails/${userId}/${videoId}.jpg`)
      await bucket.upload(thumbnailPath, {
        destination: thumbnailFile,
        metadata: {
          contentType: 'image/jpeg',
        },
      })

      // Get thumbnail URL
      const [thumbnailUrl] = await thumbnailFile.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Far future
      })

      // Process video with retries
      const transcription = await withRetries(() => 
        transcribeVideo(gcsUri)
      )

      const summary = await withRetries(() => 
        generateSummary(transcription)
      )

      // Update Firestore with results
      await videoRef.update({
        transcript: transcription,
        summary,
        thumbnailUrl,
        processingStatus: 'completed',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      // Cleanup
      fs.unlinkSync(tempFilePath)
      fs.unlinkSync(thumbnailPath)

    } catch (error) {
      console.error('Error processing video:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const currentRetries = (await videoRef.get()).data()?.retryCount || 0
      
      if (currentRetries < MAX_RETRIES) {
        await videoRef.update({
          processingStatus: 'pending',
          retryCount: currentRetries + 1,
          lastError: errorMessage
        })
        throw new functions.https.HttpsError('failed-precondition', 'Retrying video processing')
      } else {
        await videoRef.update({
          processingStatus: 'failed',
          error: errorMessage,
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        })
        throw error
      }
    }
  })
)

async function withRetries<T>(
  fn: () => Promise<T>, 
  retries = MAX_RETRIES, 
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return withRetries(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

async function transcribeVideo(gcsUri: string): Promise<string> {
  const operation = await videoIntelligence.annotateVideo({
    inputUri: gcsUri,
    features: [google.cloud.videointelligence.v1.Feature.SPEECH_TRANSCRIPTION],
    videoContext: {
      speechTranscriptionConfig: {
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
    },
  })

  const [result] = await operation[0].promise()
  const transcription = result.annotationResults?.[0]?.speechTranscriptions?.[0]?.alternatives?.[0]?.transcript || ''
  
  if (!transcription) {
    throw new Error('No transcription generated')
  }

  return transcription
}

async function generateThumbnail(
  videoPath: string, 
  videoId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join(os.tmpdir(), `${videoId}-thumb.jpg`)
    
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['50%'], // Take screenshot from middle of video
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '1280x720'
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', (err) => reject(err))
  })
}

async function generateSummary(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a professional video summarizer. Create concise, clear summaries that capture the key points."
      },
      {
        role: "user",
        content: `Please summarize this video transcript in a clear, professional manner: ${transcript}`
      }
    ],
    max_tokens: 500,
    temperature: 0.7,
  })

  return response.choices[0].message.content || ''
} 