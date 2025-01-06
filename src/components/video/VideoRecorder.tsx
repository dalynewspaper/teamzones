'use client'
import { useEffect, useRef } from 'react'
import * as bodySegmentation from '@tensorflow-models/body-segmentation'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

interface VideoRecorderProps {
  stream: MediaStream | null
  isRecording: boolean
  backgroundBlur: boolean
}

export function VideoRecorder({ stream, isRecording, backgroundBlur }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const segmenterRef = useRef<bodySegmentation.BodySegmenter>()
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const initSegmenter = async () => {
      const segmenter = await bodySegmentation.createSegmenter(
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
        {
          runtime: 'tfjs',
          modelType: 'general',
        }
      )
      segmenterRef.current = segmenter
    }

    if (backgroundBlur) {
      initSegmenter()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [backgroundBlur])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !stream) return

    let playAttempt: NodeJS.Timeout

    const setupVideo = async () => {
      try {
        video.srcObject = stream
        // Wait for metadata to load before attempting to play
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve
        })
        await video.play()
      } catch (err) {
        console.error('Error setting up video:', err)
        // If autoplay fails, wait for user interaction
        const playOnInteraction = async () => {
          try {
            await video.play()
          } catch (playErr) {
            console.error('Play error:', playErr)
          } finally {
            document.removeEventListener('click', playOnInteraction)
          }
        }
        document.addEventListener('click', playOnInteraction)
      }
    }

    setupVideo()

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const applyBackgroundBlur = async () => {
      if (!video || !canvas || !ctx || !segmenterRef.current) return

      const segmentation = await segmenterRef.current.segmentPeople(video)
      const foregroundMask = await bodySegmentation.toBinaryMask(segmentation)

      // Draw original frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Apply blur to background
      ctx.filter = 'blur(10px)'
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blurredFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'

      // Combine foreground and blurred background
      const pixels = frame.data
      const blurredPixels = blurredFrame.data
      const maskPixels = foregroundMask.data

      for (let i = 0; i < pixels.length; i += 4) {
        const maskValue = maskPixels[i / 4]
        if (maskValue === 0) { // background
          pixels[i] = blurredPixels[i]
          pixels[i + 1] = blurredPixels[i + 1]
          pixels[i + 2] = blurredPixels[i + 2]
        }
      }

      ctx.putImageData(frame, 0, 0)
      animationFrameRef.current = requestAnimationFrame(applyBackgroundBlur)
    }

    const drawFrame = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      animationFrameRef.current = requestAnimationFrame(drawFrame)
    }

    if (backgroundBlur) {
      applyBackgroundBlur()
    } else {
      drawFrame()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (playAttempt) {
        clearTimeout(playAttempt)
      }
      if (video.srcObject) {
        video.srcObject = null
      }
    }
  }, [stream, backgroundBlur])

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${backgroundBlur ? 'hidden' : 'block'}`}
        muted
        playsInline
        autoPlay
      />
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain ${backgroundBlur ? 'block' : 'hidden'}`}
        width={1280}
        height={720}
      />
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/75 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span>Recording</span>
        </div>
      )}
    </div>
  )
} 