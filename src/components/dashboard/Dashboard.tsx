'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Video, Star, Inbox, MoreVertical, Home, Settings, Users, Clock, ChevronDown, Plus, LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoRecordingInterface } from '@/components/video/VideoRecordingInterface'
import VideoPageClient from '@/components/video/VideoPageClient'
import { storage, db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, getDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em"%3EVideo Thumbnail%3C/text%3E%3C/svg%3E'

interface Update {
  id: string;
  title: string;
  timestamp: string;
  duration: string;
  views: number;
  thumbnail: string;
  url: string;
  isStarred: boolean;
  userId?: string;
  createdAt?: string;
  transcription?: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = searchParams.get('video')
  const [isRecording, setIsRecording] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [updates, setUpdates] = useState<Update[]>([])
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')

  // Load organization name when component mounts
  useEffect(() => {
    const loadOrganization = async () => {
      if (!user?.uid) return

      try {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const userData = userSnap.data()
          if (userData.organizationId) {
            const orgRef = doc(db, 'organizations', userData.organizationId)
            const orgSnap = await getDoc(orgRef)
            if (orgSnap.exists()) {
              setOrganizationName(orgSnap.data().name)
            }
          }
        }
      } catch (error) {
        console.error('Error loading organization:', error)
      }
    }

    loadOrganization()
  }, [user?.uid])

  // Load videos from Firebase when component mounts
  useEffect(() => {
    const loadVideos = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null) // Add error state if not already present

        // Wait a bit to ensure Firestore is initialized
        await new Promise(resolve => setTimeout(resolve, 1000))

        const videosQuery = query(
          collection(db, 'videos'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        )

        const querySnapshot = await getDocs(videosQuery)
        const videos: Update[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          videos.push({
            id: doc.id,
            title: data.title || 'Untitled Video',
            timestamp: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : new Date().toLocaleString(),
            duration: data.duration || '0:00',
            views: data.views || 0,
            thumbnail: data.thumbnail || placeholderImage,
            url: data.url || '',
            isStarred: data.isStarred || false,
            userId: data.userId,
            createdAt: data.createdAt || new Date().toISOString(),
          })
        })

        setUpdates(videos)
      } catch (error) {
        console.error('Error loading videos:', error)
        setError('Failed to load videos. Please try again.') // Add error state if not already present
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadVideos()
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const generateThumbnail = async (videoBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Create video element
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.autoplay = true
      video.muted = true
      video.playsInline = true

      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Set up video event handlers
      video.onloadedmetadata = () => {
        // Set canvas size to video size
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Seek to 1 second or video duration if shorter
        const seekTime = Math.min(1, video.duration)
        video.currentTime = seekTime
      }

      video.oncanplay = () => {
        // Draw video frame to canvas
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (blob) {
              // Upload thumbnail to Firebase Storage
              const thumbnailId = uuidv4()
              const thumbnailRef = ref(storage, `thumbnails/${user?.uid}/${thumbnailId}.jpg`)
              await uploadBytes(thumbnailRef, blob)
              const thumbnailUrl = await getDownloadURL(thumbnailRef)
              resolve(thumbnailUrl)
            } else {
              reject(new Error('Failed to generate thumbnail blob'))
            }
          }, 'image/jpeg', 0.7) // JPEG format with 70% quality
        } else {
          reject(new Error('Failed to get canvas context'))
        }
      }

      video.onerror = () => {
        reject(new Error('Error loading video'))
      }

      // Set video source
      video.src = URL.createObjectURL(videoBlob)
    })
  }

  const handleRecordingComplete = async (blob: Blob) => {
    if (!user) {
      console.error('No user found')
      return
    }

    try {
      setIsProcessing(true)
      
      // Generate a unique ID for the video
      const videoId = uuidv4()
      
      // Create a reference to the video file in Firebase Storage
      const storageRef = ref(storage, `videos/${user.uid}/${videoId}.webm`)
      
      // Upload the video blob
      await uploadBytes(storageRef, blob)
      
      // Get the download URL
      const url = await getDownloadURL(storageRef)
      
      // Generate and upload thumbnail
      const thumbnailUrl = await generateThumbnail(blob)
      
      // Create the video document
      const videoDoc: Update = {
        id: videoId,
        userId: user.uid,
        title: 'New Recording',
        timestamp: 'Just now',
        duration: '0:00', // You would calculate this from the actual video duration
        views: 0,
        thumbnail: thumbnailUrl,
        url: url,
        isStarred: false,
        createdAt: new Date().toISOString(),
      }
      
      // Add to Firestore
      await addDoc(collection(db, 'videos'), {
        ...videoDoc,
        timestamp: serverTimestamp(), // Use server timestamp for Firestore
      })
      
      // Update the local state
      setUpdates(prevUpdates => [videoDoc, ...prevUpdates])
      
      setIsRecording(false)
    } catch (error) {
      console.error('Error saving recording:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecordingError = (error: string) => {
    console.error('Recording error:', error)
    // You could show a toast or error message here
  }

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
            {organizationName ? `${organizationName}'s Workspace` : 'Loading...'}
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
          {videoId ? (
            <VideoPageClient videoId={videoId} />
          ) : (
            <>
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

              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4263EB]"></div>
                </div>
              ) : (
                /* Updates Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {updates.map((update) => (
                    <div
                      key={update.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
                      onClick={() => router.push(`/dashboard?video=${update.id}`)}
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={update.thumbnail || placeholderImage}
                          alt={update.title}
                          fill
                          className="rounded-t-lg object-cover"
                          unoptimized={true}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = placeholderImage;
                          }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent navigation when clicking the button
                              window.open(update.url, '_blank')
                            }}
                          >
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Recording Dialog */}
      <Dialog open={isRecording} onOpenChange={setIsRecording}>
        <DialogContent className="max-w-[90%] w-[1200px] h-[80vh] p-0 bg-white">
          <div className="h-full flex flex-col p-6 bg-white">
            <DialogHeader className="flex-none space-y-2">
              <DialogTitle className="text-2xl font-semibold">Record Update</DialogTitle>
              <DialogDescription className="text-gray-600">
                Share an update with your team
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden mt-6 bg-white">
              <VideoRecordingInterface
                onRecordingComplete={handleRecordingComplete}
                onCancel={() => setIsRecording(false)}
                onError={handleRecordingError}
                initialLayout="camera"
                initialQuality="1080p"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4263EB] mx-auto"></div>
            <p className="text-sm text-gray-600">Processing your recording...</p>
          </div>
        </div>
      )}
    </div>
  )
} 