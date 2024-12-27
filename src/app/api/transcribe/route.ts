import { NextResponse } from 'next/server'
import { SpeechClient } from '@google-cloud/speech'
import ffmpeg from 'fluent-ffmpeg'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Initialize the Speech-to-Text client
const speechClient = new SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})

export async function POST(req: Request) {
  const tempFiles = {
    videoPath: '',
    audioPath: ''
  }

  try {
    console.log('Starting transcription process...')
    
    // Get the video URL from the request body
    const body = await req.json()
    const videoUrl = body.videoUrl as string
    
    console.log('Received video URL:', videoUrl)
    
    if (!videoUrl) {
      console.error('No video URL provided')
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    // Create temporary file paths
    const tempDir = tmpdir()
    tempFiles.videoPath = join(tempDir, `${uuidv4()}.webm`)
    tempFiles.audioPath = join(tempDir, `${uuidv4()}.wav`)

    console.log('Temp paths created:', tempFiles)

    try {
      // Download video from emulator
      console.log('Original video URL:', videoUrl)
      
      // Extract the file path from the URL
      const matches = videoUrl.match(/v0\/b\/[^/]+\/o\/([^?]+)/)
      if (!matches) {
        throw new Error('Invalid storage URL format')
      }
      
      const filePath = decodeURIComponent(matches[1])
      console.log('Extracted file path:', filePath)
      
      // Use the storage emulator endpoint
      const response = await fetch(videoUrl)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Emulator response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: videoUrl
        })
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}. ${errorText}`)
      }
      
      const buffer = await response.arrayBuffer()
      await fs.writeFile(tempFiles.videoPath, Buffer.from(buffer))
      console.log('Video file written to:', tempFiles.videoPath)
      console.log('Video downloaded successfully')
    } catch (error) {
      console.error('Error downloading video:', error)
      throw new Error('Failed to download video: ' + (error instanceof Error ? error.message : String(error)))
    }

    // Convert video to audio using ffmpeg
    console.log('Converting video to audio...')
    await new Promise((resolve, reject) => {
      ffmpeg(tempFiles.videoPath)
        .toFormat('wav')
        .audioFrequency(16000)
        .audioChannels(1)
        .on('start', (command) => {
          console.log('FFmpeg process started:', command)
        })
        .on('end', () => {
          console.log('FFmpeg process completed')
          resolve(null)
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err)
          reject(new Error('Failed to convert video to audio: ' + err.message))
        })
        .save(tempFiles.audioPath)
    })

    // Read the audio file
    console.log('Reading audio file...')
    const audioContent = await fs.readFile(tempFiles.audioPath, { encoding: 'base64' })
    console.log('Audio file read successfully')

    // Configure the transcription request
    console.log('Starting Speech-to-Text transcription...')
    const request = {
      audio: {
        content: audioContent,
      },
      config: {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        model: 'video',
      },
    }

    // Perform the transcription
    const [operation] = await speechClient.longRunningRecognize(request)
    console.log('Waiting for transcription to complete...')
    const [response] = await operation.promise()
    console.log('Transcription completed')

    // Combine all transcriptions
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript || '')
      .join('\n') || ''

    console.log('Transcription successful')
    return NextResponse.json({ transcription })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe video' },
      { status: 500 }
    )
  } finally {
    // Clean up temporary files
    try {
      await fs.unlink(tempFiles.videoPath).catch(() => {})
      await fs.unlink(tempFiles.audioPath).catch(() => {})
      console.log('Temporary files cleaned up')
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
    }
  }
} 