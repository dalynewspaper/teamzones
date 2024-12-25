import * as functions from 'firebase-functions'
import { Storage } from '@google-cloud/storage'
import { SpeechClient } from '@google-cloud/speech'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import * as ffmpeg from 'fluent-ffmpeg'
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'

admin.initializeApp()
const speech = new SpeechClient({
  keyFilename: 'service-account.json'
})
const storage = new Storage()
const db = getFirestore()

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export const processVideo = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name
  if (!filePath?.includes('videos/')) return

  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath))
  const audioFilePath = `${tempFilePath}.wav`

  try {
    // Download video file
    await storage.bucket(object.bucket).file(filePath).download({
      destination: tempFilePath
    })

    // Extract audio using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .toFormat('wav')
        .on('error', reject)
        .on('end', resolve)
        .save(audioFilePath)
    })

    // Read audio file
    const audioBytes = fs.readFileSync(audioFilePath).toString('base64')

    // Configure transcription request
    const audio = {
      content: audioBytes
    }
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      model: 'video',
      useEnhanced: true
    }

    // Update status to transcribing
    const weekId = filePath.split('/')[1]
    const videoId = filePath.split('/')[2].split('.')[0]
    await updateVideoStatus(weekId, videoId, 'transcribing')

    // Perform transcription
    const [response] = await speech.recognize({ audio, config })
    const transcript = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n')

    // Update video with transcript
    await updateVideoTranscript(weekId, videoId, transcript)

    // Cleanup temp files
    fs.unlinkSync(tempFilePath)
    fs.unlinkSync(audioFilePath)

  } catch (error) {
    console.error('Error processing video:', error)
    const weekId = filePath.split('/')[1]
    const videoId = filePath.split('/')[2].split('.')[0]
    await updateVideoStatus(weekId, videoId, 'error')
  }
})

async function updateVideoStatus(weekId: string, videoId: string, status: string) {
  const weekRef = db.collection('weeks').doc(weekId)
  const weekDoc = await weekRef.get()
  const weekData = weekDoc.data()

  if (weekData?.videos) {
    const updatedVideos = weekData.videos.map((v: any) =>
      v.id === videoId ? { ...v, status } : v
    )
    await weekRef.update({ videos: updatedVideos })
  }
}

async function updateVideoTranscript(weekId: string, videoId: string, transcript: string) {
  const weekRef = db.collection('weeks').doc(weekId)
  const weekDoc = await weekRef.get()
  const weekData = weekDoc.data()

  if (weekData?.videos) {
    const updatedVideos = weekData.videos.map((v: any) =>
      v.id === videoId 
        ? { 
            ...v, 
            transcript,
            status: 'ready',
            updatedAt: new Date().toISOString()
          } 
        : v
    )
    await weekRef.update({ videos: updatedVideos })
  }
} 