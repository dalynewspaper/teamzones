'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Video, Star, Inbox, MoreVertical, Home, Settings, Users, Clock, ChevronDown, Plus, LogOut, XCircle, Target, BarChart3, Activity, ListTodo, MessageSquare, BarChart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { VideoRecordingInterface } from '@/components/video/VideoRecordingInterface'
import VideoPageClient from '@/components/video/VideoPageClient'
import { storage, db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, getDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { WeekNavigator } from './WeekNavigator'
import { useWeek } from '@/contexts/WeekContext'
import { getTeams } from '@/services/teamService'
import { Team } from '@/types/teams'
import { EmptyState } from './EmptyState'
import { NewTeamModal } from './NewTeamModal'
import { WeeklyGoalsDisplay } from './WeeklyGoalsDisplay'
import { DashboardContent } from './DashboardContent'

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
  weekId?: string;
}

interface DashboardProps {
  children?: React.ReactNode
}

export function Dashboard({ children }: DashboardProps) {
  const { user, signOut } = useAuth()
  const { currentWeek } = useWeek()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const videoId = searchParams.get('video')
  const [isRecording, setIsRecording] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [updates, setUpdates] = useState<Update[]>([])
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeam, setActiveTeam] = useState<string | null>(null)
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false)

  // Load organization name and teams
  const loadTeams = useCallback(async () => {
    if (!user?.organizationId || !user?.uid) return
    try {
      const userTeams = await getTeams(user.organizationId)
      setTeams(userTeams)
      
      if (userTeams.length > 0 && !activeTeam) {
        const defaultTeam = userTeams.find(t => t.isDefault)
        setActiveTeam(defaultTeam?.id || userTeams[0].id)
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    }
  }, [user?.organizationId, user?.uid, activeTeam])

  // Load organization name and teams when component mounts
  useEffect(() => {
    const loadOrganizationAndTeams = async () => {
      if (!user?.organizationId) return

      try {
        // Load organization
        const orgRef = doc(db, 'organizations', user.organizationId)
        const orgSnap = await getDoc(orgRef)
        if (orgSnap.exists()) {
          setOrganizationName(orgSnap.data().name)
        }

        // Load teams
        await loadTeams()
      } catch (error) {
        console.error('Error loading organization and teams:', error)
      }
    }

    loadOrganizationAndTeams()
  }, [user?.organizationId, loadTeams])

  // Handle team selection
  const handleTeamSelect = useCallback((teamId: string) => {
    setActiveTeam(teamId)
  }, [])

  const handleTeamCreated = useCallback(async () => {
    await loadTeams()
    setIsNewTeamModalOpen(false)
  }, [loadTeams])

  // Teams Section JSX
  const teamsSection = (
    <div className="p-3 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teams</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => setIsNewTeamModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {teams.map((team) => (
          <Button
            key={team.id}
            variant="ghost"
            className={`w-full justify-start text-sm font-medium ${
              activeTeam === team.id ? 'bg-gray-100' : ''
            }`}
            onClick={() => handleTeamSelect(team.id)}
          >
            <Users className="h-4 w-4 mr-3 flex-shrink-0" />
            <span className="truncate">{team.name}</span>
          </Button>
        ))}
        {teams.length === 0 && (
          <div className="text-sm text-gray-500 py-2 px-3">
            No teams available
          </div>
        )}
      </div>
    </div>
  )

  // Load videos from Firebase when component mounts or week changes
  useEffect(() => {
    const loadVideos = async () => {
      if (!user || !currentWeek) return

      try {
        setIsLoading(true)
        setError(null)

        // Wait a bit to ensure Firestore is initialized
        await new Promise(resolve => setTimeout(resolve, 1000))

        const videosQuery = query(
          collection(db, 'videos'),
          where('userId', '==', user.uid),
          where('weekId', '==', currentWeek.id),
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
            weekId: data.weekId,
          })
        })

        setUpdates(videos)
      } catch (error) {
        console.error('Error loading videos:', error)
        setError('Failed to load videos. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && currentWeek) {
      loadVideos()
    }
  }, [user, currentWeek])

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
    if (!user || !currentWeek) {
      console.error('No user or week found')
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
        weekId: currentWeek.id,
        title: 'New Recording',
        timestamp: 'Just now',
        duration: '0:00',
        views: 0,
        thumbnail: thumbnailUrl,
        url: url,
        isStarred: false,
        createdAt: new Date().toISOString(),
      }
      
      // Add to Firestore
      await addDoc(collection(db, 'videos'), {
        ...videoDoc,
        timestamp: serverTimestamp(),
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

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Strategic Goals', href: '/dashboard/goals', icon: Target },
    { name: 'Weekly Goals', href: '/dashboard/goals/weekly', icon: ListTodo },
    { name: 'My Updates', href: '/dashboard/updates', icon: MessageSquare },
    { name: 'Insights', href: '/dashboard/insights', icon: BarChart },
    { name: 'Activity', href: '/dashboard/activity', icon: Activity },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings }
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - fixed */}
      <div className="w-64 border-r bg-white flex flex-col h-screen flex-shrink-0">
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
          <Button
            variant="ghost"
            className="w-full justify-start text-sm mt-2 text-[#4263EB] hover:text-[#3b5bdb] hover:bg-blue-50"
            onClick={() => router.push('/dashboard/settings?tab=members')}
          >
            <Users className="h-4 w-4 mr-2" />
            Invite teammates
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                <item.icon className="h-4 w-4 mr-3" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Teams Section */}
        {teamsSection}

        {/* User Section */}
        <div className="p-3 border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>

        {/* Add NewTeamModal */}
        <NewTeamModal
          isOpen={isNewTeamModalOpen}
          onClose={() => setIsNewTeamModalOpen(false)}
          onTeamCreated={handleTeamCreated}
        />
      </div>

      {/* Main content area - scrollable */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top navbar - fixed */}
        <div className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
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
        </div>

        {/* Week navigator bar - only show on home screen */}
        {pathname === '/dashboard' && (
          <div className="h-[88px] border-b bg-white flex items-center px-6 flex-shrink-0">
            <div className="max-w-7xl w-full mx-auto">
              <WeekNavigator />
            </div>
          </div>
        )}
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {children || <DashboardContent />}
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