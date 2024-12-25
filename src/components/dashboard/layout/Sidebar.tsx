'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  VideoCameraIcon,
  FolderIcon,
  ClockIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { VideoRecordingButton } from '../VideoRecordingButton';
import { useWeek } from '@/contexts/WeekContext';

export function Sidebar() {
  const pathname = usePathname();
  const { weekId } = useWeek();

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'My Videos', href: '/dashboard/videos', icon: VideoCameraIcon },
    { name: 'Team Library', href: '/dashboard/library', icon: FolderIcon },
    { name: 'Recent', href: '/dashboard/recent', icon: ClockIcon },
    { name: 'Starred', href: '/dashboard/starred', icon: StarIcon },
    { name: 'Team', href: '/dashboard/team', icon: UserGroupIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">TeamZones</h1>
        </div>

        {/* Record Button */}
        <div className="p-4">
          <VideoRecordingButton
            weekId={weekId}
            className="w-full justify-center py-3"
          >
            Record New Video
          </VideoRecordingButton>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-blue-700' : 'text-gray-400'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
} 