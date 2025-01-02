'use client'
import { VideoRecordIcon } from '@/components/ui/icons'
import { VideoRecordingButton } from './VideoRecordingButton'
import { Coffee, Sparkles, Rocket, Sun } from 'lucide-react'

interface EmptyStateProps {
  weekId: string
}

const emptyStateMessages = [
  {
    title: "Camera Shy? 🎥",
    description: "Your team is eagerly awaiting your Hollywood debut! Time to be a star! ⭐️",
    Icon: Coffee,
  },
  {
    title: "Mic Check, 1-2-3! 🎤",
    description: "Your stage is set, the audience (your team) is waiting. No pressure, but... ACTION! 🎬",
    Icon: Sparkles,
  },
  {
    title: "Breaking News! 📰",
    description: "This just in: Talented team member hasn't recorded their update yet. Film at 11! 🎥",
    Icon: Rocket,
  },
  {
    title: "Plot Twist! 🎭",
    description: "In a shocking turn of events, this week's episodes are still in production. Stay tuned! 📺",
    Icon: Sun,
  },
]

export function EmptyState({ weekId }: EmptyStateProps) {
  // Randomly select a message based on the weekId to keep it consistent for the same week
  const messageIndex = Math.abs(weekId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % emptyStateMessages.length
  const { title, description, Icon } = emptyStateMessages[messageIndex]

  return (
    <div className="text-center py-16 px-4">
      <div className="relative mx-auto mb-6 group">
        <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative h-16 w-16 bg-[#4263EB] rounded-full flex items-center justify-center mx-auto animate-bounce">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3 animate-fade-in">{title}</h3>
      <p className="text-gray-500 mb-8 animate-fade-in">{description}</p>
      <VideoRecordingButton weekId={weekId} />
    </div>
  )
} 