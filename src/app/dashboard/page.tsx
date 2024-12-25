'use client'
import { VideoList } from '@/components/video/VideoList'

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Welcome back!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Record and share updates with your team
          </p>
        </div>

        <VideoList />
      </div>
    </div>
  )
} 