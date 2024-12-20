'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export function Header() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="h-16 bg-white border-b fixed top-0 left-64 right-0 z-10">
      <div className="h-full flex items-center justify-between px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for people, tags, folders, Spaces, and Looms"
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            12/25 videos
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
            Upgrade
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center h-full text-gray-500">
                {user?.email?.[0].toUpperCase()}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
} 