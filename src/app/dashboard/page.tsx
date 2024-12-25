'use client'
import { VideoList } from '@/components/video/VideoList'
import { VideoRecordingButton } from '@/components/dashboard/VideoRecordingButton'
import { useWeek } from '@/contexts/WeekContext'
import { VideoCameraIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline'
import { WeekNavigator } from '@/components/dashboard/WeekNavigator'

export default function DashboardPage() {
  const { weekId } = useWeek()

  return (
    <div>
      {/* Week Navigator */}
      <WeekNavigator />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Welcome back!</h1>
          <p className="mt-1 text-sm text-gray-500">Record and share updates with your team</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <VideoCameraIcon className="w-6 h-6 mb-3" />
            <h3 className="text-base font-medium mb-1">Record Update</h3>
            <p className="text-sm text-blue-100 mb-4">Share your weekly progress</p>
            <VideoRecordingButton
              weekId={weekId}
              variant="outline"
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Start Recording
            </VideoRecordingButton>
          </div>
          
          <div className="p-5 bg-white border rounded-lg">
            <ClockIcon className="w-6 h-6 text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">Recent Videos</h3>
            <p className="text-sm text-gray-500">View recent recordings</p>
          </div>

          <div className="p-5 bg-white border rounded-lg">
            <StarIcon className="w-6 h-6 text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">Starred</h3>
            <p className="text-sm text-gray-500">Important videos</p>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-white rounded-lg border">
          <div className="px-5 py-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-medium text-gray-900">Recent Updates</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                View All
              </button>
            </div>
          </div>
          <div className="p-5">
            <VideoList />
          </div>
        </div>
      </div>
    </div>
  )
} 