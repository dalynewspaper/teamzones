'use client';
import { ProfileMenu } from '@/components/layout/ProfileMenu';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-64 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search videos..."
              className="w-full py-2 pl-10 pr-4 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            Help
          </button>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
} 