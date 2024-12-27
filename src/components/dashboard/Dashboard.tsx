'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Video, Star, Inbox, MoreVertical, Home, Settings, Users, Clock, ChevronDown, Plus, LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em"%3EVideo Thumbnail%3C/text%3E%3C/svg%3E'

export function Dashboard() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updates = [
    {
      id: 1,
      title: 'Weekly Team Update - Sprint Planning',
      timestamp: '2 hours ago',
      duration: '5:32',
      views: 12,
      thumbnail: placeholderImage,
      isStarred: true,
    },
    {
      id: 2,
      title: 'Product Feature Demo - New Analytics Dashboard',
      timestamp: 'Yesterday',
      duration: '3:45',
      views: 8,
      thumbnail: placeholderImage,
      isStarred: false,
    },
    {
      id: 3,
      title: 'Design Review - Mobile App UI Updates',
      timestamp: '2 days ago',
      duration: '8:15',
      views: 15,
      thumbnail: placeholderImage,
      isStarred: true,
    },
  ]

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <Link href="/" className="text-xl font-semibold text-[#4263EB]">
            OpenAsync
          </Link>
        </div>

        {/* Workspace Selector */}
        <div className="px-3 py-2 border-b border-gray-200">
          <Button variant="ghost" className="w-full justify-between text-sm font-medium">
            TeamZones
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <Button variant="ghost" className="w-full justify-start text-sm font-medium">
            <Home className="h-4 w-4 mr-3" />
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sm font-medium">
            <Clock className="h-4 w-4 mr-3" />
            Recent
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sm font-medium">
            <Star className="h-4 w-4 mr-3" />
            Starred
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sm font-medium">
            <Inbox className="h-4 w-4 mr-3" />
            Inbox
          </Button>
        </nav>

        {/* Teams Section */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teams</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-sm font-medium">
              <Users className="h-4 w-4 mr-3" />
              Engineering
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm font-medium">
              <Users className="h-4 w-4 mr-3" />
              Design
            </Button>
          </div>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-gray-200">
          <Button variant="ghost" className="w-full justify-start text-sm font-medium">
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center flex-1 space-x-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search updates..."
                className="pl-10 w-full bg-gray-50 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => setIsRecording(true)}
            className="bg-[#4263EB] hover:bg-[#3b5bdb] text-white"
          >
            <Video className="mr-2 h-4 w-4" /> Record Update
          </Button>
        </header>

        {/* Main Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* Filters */}
          <div className="flex space-x-2 mb-6">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-[#4263EB]' : ''}
              size="sm"
            >
              All Updates
            </Button>
            <Button
              variant={filter === 'starred' ? 'default' : 'ghost'}
              onClick={() => setFilter('starred')}
              className={filter === 'starred' ? 'bg-[#4263EB]' : ''}
              size="sm"
            >
              <Star className="mr-2 h-3 w-3" /> Starred
            </Button>
            <Button
              variant={filter === 'inbox' ? 'default' : 'ghost'}
              onClick={() => setFilter('inbox')}
              className={filter === 'inbox' ? 'bg-[#4263EB]' : ''}
              size="sm"
            >
              <Inbox className="mr-2 h-3 w-3" /> Inbox
            </Button>
          </div>

          {/* Updates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="relative aspect-video">
                  <Image
                    src={update.thumbnail}
                    alt={update.title}
                    fill
                    className="rounded-t-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white">
                      Watch Now
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {update.duration}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#4263EB] transition-colors">
                      {update.title}
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{update.timestamp}</span>
                    <span>{update.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recording Dialog */}
      <Dialog open={isRecording} onOpenChange={setIsRecording}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Record Update</DialogTitle>
            <DialogDescription>
              Share what you're working on with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-gray-100 rounded-lg"></div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsRecording(false)}>
              Cancel
            </Button>
            <Button className="bg-[#4263EB]">Start Recording</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 