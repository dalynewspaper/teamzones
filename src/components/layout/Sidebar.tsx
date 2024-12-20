'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  VideoCameraIcon,
  BellIcon,
  BookmarkIcon,
  ClockIcon,
  CogIcon,
  GiftIcon
} from '@heroicons/react/24/outline'

export function Sidebar() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'My Library', href: '/dashboard/library', icon: VideoCameraIcon },
    { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
    { name: 'Watch Later', href: '/dashboard/watch-later', icon: BookmarkIcon },
    { name: 'History', href: '/dashboard/history', icon: ClockIcon },
    { name: 'Earn free videos', href: '/dashboard/earn', icon: GiftIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
  ]

  return (
    <div className="w-64 bg-white border-r h-screen fixed left-0 top-0">
      <div className="flex flex-col h-full">
        {/* Workspace Section */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your Workspace</h2>
            <button className="text-sm text-gray-500">
              <span>▼</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">1 member</p>
          <button className="mt-4 text-sm text-blue-600 flex items-center">
            <span>Invite teammates</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Record Button */}
        <div className="p-4 border-t">
          <button className="w-full bg-blue-600 text-white rounded-md py-2 px-4 flex items-center justify-center">
            <VideoCameraIcon className="h-5 w-5 mr-2" />
            Record a video
          </button>
        </div>
      </div>
    </div>
  )
} 