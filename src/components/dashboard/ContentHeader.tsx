'use client'
import { PlusIcon } from '@heroicons/react/24/outline'

export function ContentHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly Updates</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center">
            <PlusIcon className="h-5 w-5 mr-1" />
            New video
          </button>
        </div>
      </div>
    </div>
  )
} 