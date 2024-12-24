'use client'
import { useEffect, useState } from 'react'

interface RecordingTimerProps {
  isRecording: boolean
  onTimeUpdate?: (seconds: number) => void
}

export function RecordingTimer({ isRecording, onTimeUpdate }: RecordingTimerProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isRecording) {
      intervalId = setInterval(() => {
        setSeconds(prev => {
          const newTime = prev + 1
          onTimeUpdate?.(newTime)
          return newTime
        })
      }, 1000)
    } else {
      setSeconds(0)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isRecording, onTimeUpdate])

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="font-mono text-sm">
      {formatTime(seconds)}
    </div>
  )
} 