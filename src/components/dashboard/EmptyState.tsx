'use client'
import { VideoRecordIcon } from '@/components/ui/icons'
import { VideoRecordingButton } from './VideoRecordingButton'
import { Coffee, Sparkles, Rocket, Sun } from 'lucide-react'

interface EmptyStateProps {
  weekId: string
}

const emptyStateMessages = [
  {
    title: "It's Quiet... Too Quiet!",
    description: "Break the silence with your first video update of the week.",
    Icon: Coffee,
  },
  {
    title: "This Week's Looking Empty",
    description: "Time to fill it with some awesome updates!",
    Icon: Sparkles,
  },
  {
    title: "Ready for Takeoff!",
    description: "Launch your first update of the week.",
    Icon: Rocket,
  },
  {
    title: "Fresh Week, Fresh Start!",
    description: "Kick off the week with your first update.",
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
        <div className="relative h-16 w-16 bg-[#4263EB] rounded-full flex items-center justify-center mx-auto">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 mb-8">{description}</p>
      <VideoRecordingButton weekId={weekId} />
    </div>
  )
} 