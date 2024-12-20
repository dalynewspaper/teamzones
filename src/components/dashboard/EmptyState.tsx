'use client'
import { VideoCameraIcon } from '@heroicons/react/24/outline'

export function EmptyState() {
  return (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
      <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No updates for this week</h3>
      <p className="mt-2 text-sm text-gray-500">
        Get started by recording your first weekly update for the team.
      </p>
      <div className="mt-6">
        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <VideoCameraIcon className="h-5 w-5 mr-2" />
          Record Update
        </button>
      </div>
    </div>
  )
} 