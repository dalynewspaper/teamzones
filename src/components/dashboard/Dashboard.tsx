'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Video, Star, Inbox, MoreVertical, Home, Settings, Users, Clock, ChevronDown, Plus, LogOut, XCircle, Target, BarChart3, Activity, ListTodo, MessageSquare, BarChart, Circle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { VideoRecordingInterface } from '@/components/video/VideoRecordingInterface'
import VideoPageClient from '@/components/video/VideoPageClient'
import { storage, db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { WeekNavigator } from './WeekNavigator'
import { useWeek } from '@/contexts/WeekContext'
import { getTeams, subscribeToTeams } from '@/services/teamService'
import { Team } from '@/types/teams'
import { EmptyState } from './EmptyState'
import { NewTeamModal } from './NewTeamModal'
import { WeeklyGoalsDisplay } from './WeeklyGoalsDisplay'
import { DashboardContent } from './DashboardContent'
import { useToast } from '@/components/ui/use-toast'

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
  size?: number;
  type?: string;
  organizationId?: string;
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
  const { toast } = useToast()

  // Load organization name and teams
  useEffect(() => {
    const loadOrganizationAndTeams = async () => {
      if (!user?.organizationId) return

      try {
        setIsLoading(true)
        
        // Subscribe to organization updates
        const orgRef = doc(db, 'organizations', user.organizationId)
        const unsubOrg = onSnapshot(orgRef, (snapshot) => {
          if (snapshot.exists()) {
            setOrganizationName(snapshot.data().name)
          }
        })

        // Subscribe to teams updates
        const unsubTeams = subscribeToTeams(user.organizationId, (userTeams: Team[]) => {
          setTeams(userTeams)
          if (userTeams.length > 0 && !activeTeam) {
            const defaultTeam = userTeams.find((t: Team) => t.isDefault) || userTeams[0]
            setActiveTeam(defaultTeam.id)
          }
        })

        setIsLoading(false)

        // Cleanup subscriptions
        return () => {
          unsubOrg()
          unsubTeams()
        }
      } catch (error) {
        console.error('Error loading organization and teams:', error)
        setIsLoading(false)
      }
    }

    loadOrganizationAndTeams()
  }, [user?.organizationId, activeTeam])

  // Handle team selection
  const handleTeamSelect = useCallback((teamId: string) => {
    setActiveTeam(teamId)
  }, [])

  const handleTeamCreated = useCallback(() => {
    setIsNewTeamModalOpen(false)
  }, [])

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

  // Define loadVideos before it's used
  const loadVideos = async () => {
    if (!user) {
      console.log('No user available, skipping video load')
      return
    }

    if (!currentWeek) {
      console.log('No current week available, skipping video load')
      return
    }

    console.log('Loading videos for week:', {
      weekId: currentWeek.id,
      weekNumber: currentWeek.weekNumber,
      startDate: currentWeek.startDate,
      endDate: currentWeek.endDate,
      organizationId: user.organizationId
    })

    try {
      setIsLoading(true)
      setError(null)

      // Get the week document directly
      const weekRef = doc(db, 'weeks', currentWeek.id)
      const weekDoc = await getDoc(weekRef)

      if (!weekDoc.exists()) {
        console.log('Week document not found:', currentWeek.id)
        setUpdates([])
        return
      }

      const weekData = weekDoc.data()
      console.log('Found week document:', weekData)

      // Extract videos from the week document
      const videos = (weekData.videos || []).map((video: any) => ({
        id: video.id,
        title: video.title || 'Untitled Video',
        timestamp: video.timestamp || video.createdAt || new Date().toISOString(),
        duration: video.duration || '0:00',
        views: video.views || 0,
        thumbnail: video.thumbnail || placeholderImage,
        url: video.url || '',
        isStarred: video.isStarred || false,
        userId: video.userId,
        createdAt: video.createdAt || new Date().toISOString(),
        weekId: currentWeek.id,
        organizationId: video.organizationId
      }))

      console.log('Found videos:', videos.length)
      setUpdates(videos)
    } catch (error) {
      console.error('Error loading videos:', error)
      setError('Failed to load videos. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Load videos when week changes
  useEffect(() => {
    if (!user?.organizationId || !currentWeek?.id) return
    loadVideos()
  }, [currentWeek?.id, filter, searchQuery, user?.organizationId])

  // Load videos when active team changes
  useEffect(() => {
    if (!user?.organizationId || !currentWeek?.id || !activeTeam) return
    loadVideos()
  }, [activeTeam])

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

  const handleRecordingComplete = async (recording: { 
    blob: Blob;
    metadata: {
      duration: string;
      size: number;
      type: string;
      timestamp: string;
    }
  }) => {
    if (!user) {
      console.error('No user found')
      return
    }

    if (!currentWeek) {
      console.error('No current week found')
      return
    }

    console.log('Recording completed with week:', {
      weekId: currentWeek.id,
      weekNumber: currentWeek.weekNumber,
      startDate: currentWeek.startDate,
      endDate: currentWeek.endDate,
      organizationId: user.organizationId
    })

    try {
      setIsProcessing(true)
      
      // Generate a unique ID for the video
      const videoId = uuidv4()
      
      console.log('Uploading video to storage:', {
        path: `videos/${user.uid}/${videoId}`,
        size: recording.metadata.size,
        type: recording.metadata.type
      })

      // Create a reference to the video file in Firebase Storage
      const storageRef = ref(storage, `videos/${user.uid}/${videoId}`)
      
      // Upload the video blob
      await uploadBytes(storageRef, recording.blob)
      console.log('Video uploaded to storage successfully')
      
      // Get the download URL
      const url = await getDownloadURL(storageRef)
      console.log('Got download URL:', url)
      
      // Generate and upload thumbnail
      const thumbnailUrl = await generateThumbnail(recording.blob)
      console.log('Generated thumbnail URL:', thumbnailUrl)
      
      const now = new Date().toISOString()
      
      // Create the video document
      const videoDoc: Update = {
        id: videoId,
        userId: user.uid,
        organizationId: user.organizationId || undefined,
        weekId: currentWeek.id,
        title: 'New Recording',
        timestamp: now,
        duration: recording.metadata.duration,
        views: 0,
        thumbnail: thumbnailUrl,
        url: url,
        isStarred: false,
        createdAt: now,
        size: recording.metadata.size,
        type: recording.metadata.type
      }

      console.log('Saving video document:', videoDoc)
      
      // Get the week document
      const weekRef = doc(db, 'weeks', currentWeek.id)
      const weekDoc = await getDoc(weekRef)

      if (!weekDoc.exists()) {
        // Create new week document if it doesn't exist
        await setDoc(weekRef, {
          id: currentWeek.id,
          startDate: currentWeek.startDate,
          endDate: currentWeek.endDate,
          status: 'active',
          videos: [videoDoc],
          createdAt: now,
          updatedAt: now
        })
      } else {
        // Update existing week document
        await updateDoc(weekRef, {
          videos: arrayUnion(videoDoc),
          updatedAt: now
        })
      }

      console.log('Video saved to week document')
      
      // Update the local state
      setUpdates(prevUpdates => [videoDoc, ...prevUpdates])
      
      setIsRecording(false)
      toast({
        title: "Video recorded successfully",
        description: "Your video update has been published.",
        duration: 5000,
      })

      // Reload videos to ensure we have the latest data
      loadVideos()
    } catch (error) {
      console.error('Error saving recording:', error)
      toast({
        title: "Error saving recording",
        description: "Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecordingError = (error: string) => {
    console.error('Recording error:', error)
    // You could show a toast or error message here
  }

  const navigation = [
    { name: 'Weekly Updates', href: '/dashboard', icon: Video },
    { name: 'Tasks', href: '/dashboard/goals/weekly', icon: ListTodo },
    { name: 'Strategic Goals', href: '/dashboard/goals', icon: Target },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings }
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - fixed */}
      <div className="w-64 border-r bg-white flex flex-col h-screen flex-shrink-0">
        {/* Logo */}
        <div className="h-[88px] flex items-center px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.svg" 
              alt="OpenAsync" 
              width={62} 
              height={12} 
              className="w-auto h-6"
              priority
            />
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
