'use client'
import { PlusIcon } from '@heroicons/react/24/outline'

export function ContentHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Library</h1>
          <h2 className="text-3xl font-bold mt-2">Videos</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 border rounded-md text-sm">
            New folder
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center">
            <PlusIcon className="h-5 w-5 mr-1" />
            New video
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-8 border-b">
        <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600">
          Videos
        </button>
        <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
          Archive
        </button>
        <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
          Screenshots
        </button>
        <div className="flex-1" />
        <span className="text-sm text-gray-500">12 videos</span>
      </div>
    </div>
  )
} 