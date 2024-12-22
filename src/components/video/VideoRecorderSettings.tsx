'use client'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import {
  CogIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SignalIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export interface Resolution {
  width: number
  height: number
  label: string
  fps: number
  quality: 'Standard' | 'High' | 'Ultra'
}

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

const RESOLUTIONS: Resolution[] = [
  { 
    width: 1920, 
    height: 1080, 
    label: '1080p Ultra HD', 
    fps: 60,
    quality: 'Ultra'
  },
  { 
    width: 1280, 
    height: 720, 
    label: '720p HD', 
    fps: 30,
    quality: 'High'
  },
  { 
    width: 854, 
    height: 480, 
    label: '480p SD',
    fps: 30,
    quality: 'Standard'
  },
]

export function VideoRecorderSettings({
  settings,
  onSettingsChange,
  onTestMode
}: VideoRecorderSettingsProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState<Resolution>(RESOLUTIONS[0])

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoading(true)
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        
        const devices = await navigator.mediaDevices.enumerateDevices()
        
        const videoInputs = devices.filter(device => device.kind === 'videoinput')
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        
        setVideoDevices(videoInputs)
        setAudioDevices(audioInputs)

        // Set default devices if not already set
        if (!settings.videoDeviceId && videoInputs.length) {
          onSettingsChange({
            ...settings,
            videoDeviceId: videoInputs[0].deviceId
          })
        }
        if (!settings.audioDeviceId && audioInputs.length) {
          onSettingsChange({
            ...settings,
            audioDeviceId: audioInputs[0].deviceId
          })
        }
      } catch (error) {
        console.error('Failed to load media devices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
    }
  }, [])

  const handleDeviceChange = (type: 'video' | 'audio', deviceId: string) => {
    onSettingsChange({
      ...settings,
      [type === 'video' ? 'videoDeviceId' : 'audioDeviceId']: deviceId
    })
  }

  const handleResolutionChange = (resolution: Resolution) => {
    onSettingsChange({
      ...settings,
      resolution: {
        width: resolution.width,
        height: resolution.height
      }
    })
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center gap-2 hover:bg-gray-50 border border-gray-200"
      >
        <CogIcon className="w-5 h-5 text-gray-600" />
        <span className="text-gray-700">Recording Settings</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-[400px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recording Setup</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Loading devices...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Video Quality Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Video Quality
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {RESOLUTIONS.map((resolution) => (
                    <button
                      key={resolution.label}
                      onClick={() => {
                        setSelectedQuality(resolution)
                        handleResolutionChange(resolution)
                      }}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${selectedQuality.label === resolution.label
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          {resolution.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {resolution.fps}fps • {resolution.quality}
                        </div>
                      </div>
                      {selectedQuality.label === resolution.label && (
                        <CheckIcon className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Selectors */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <VideoCameraIcon className="w-5 h-5 text-gray-500" />
                    Camera
                  </label>
                  <div className="relative">
                    <select
                      value={settings.videoDeviceId}
                      onChange={(e) => handleDeviceChange('video', e.target.value)}
                      className="w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-3 pr-10 py-2 text-sm"
                    >
                      {videoDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                    <SignalIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MicrophoneIcon className="w-5 h-5 text-gray-500" />
                    Microphone
                  </label>
                  <div className="relative">
                    <select
                      value={settings.audioDeviceId}
                      onChange={(e) => handleDeviceChange('audio', e.target.value)}
                      className="w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-3 pr-10 py-2 text-sm"
                    >
                      {audioDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                    <SignalIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  onClick={onTestMode}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <CogIcon className="w-4 h-4" />
                  Test Setup
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>
                    Apply Settings
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 