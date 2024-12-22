'use client'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import {
  VideoCameraIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

export interface RecordingSettings {
  videoDeviceId: string
  audioDeviceId: string
  resolution: {
    width: number
    height: number
  }
  isScreenShare: boolean
}

interface VideoRecorderSettingsProps {
  settings: RecordingSettings
  onSettingsChange: (settings: RecordingSettings) => void
  onTestMode: () => void
}

const RESOLUTIONS = [
  { label: '720p', width: 1280, height: 720 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '4K', width: 3840, height: 2160 },
]

export function VideoRecorderSettings({
  settings,
  onSettingsChange,
  onTestMode,
}: VideoRecorderSettingsProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getDevices() {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        
        const devices = await navigator.mediaDevices.enumerateDevices()
        setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
        setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
      } catch (error) {
        console.error('Failed to get devices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getDevices()
  }, [])

  const updateSettings = (update: Partial<RecordingSettings>) => {
    onSettingsChange({ ...settings, ...update })
  }

  if (isLoading) {
    return <div>Loading devices...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <VideoCameraIcon className="h-4 w-4 inline mr-2" />
            Camera
          </label>
          <select
            value={settings.videoDeviceId}
            onChange={(e) => updateSettings({ videoDeviceId: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 4)}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MicrophoneIcon className="h-4 w-4 inline mr-2" />
            Microphone
          </label>
          <select
            value={settings.audioDeviceId}
            onChange={(e) => updateSettings({ audioDeviceId: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resolution
        </label>
        <div className="flex space-x-2">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.label}
              onClick={() => updateSettings({ resolution: { width: res.width, height: res.height } })}
              className={`px-3 py-1 rounded-md text-sm ${
                settings.resolution.width === res.width
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => updateSettings({ isScreenShare: !settings.isScreenShare })}
            className={`flex items-center px-3 py-2 rounded-md text-sm ${
              settings.isScreenShare
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ComputerDesktopIcon className="h-4 w-4 mr-2" />
            {settings.isScreenShare ? 'Screen Share On' : 'Screen Share Off'}
          </button>
        </div>

        <Button onClick={onTestMode} variant="secondary">
          <Cog6ToothIcon className="h-4 w-4 mr-2" />
          Test Setup
        </Button>
      </div>
    </div>
  )
} 