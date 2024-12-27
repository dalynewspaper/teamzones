'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Share2, Copy, Clock, Calendar, Eye, MessageSquare, ArrowLeft, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface VideoDetails {
  id: string
  title: string
  description: string
  url: string
  thumbnail: string
  duration: string
  views: number
  createdAt: string
  userId: string
  transcription?: string
}

interface VideoPageClientProps {
  videoId: string
}

export default function VideoPageClient({ videoId }: VideoPageClientProps) {
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('transcript')
  const router = useRouter()

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) {
        setError('No video ID provided')
        setIsLoading(false)
        return
      }

      try {
        const videoDoc = await getDoc(doc(db, 'videos', videoId))
        if (!videoDoc.exists()) {
          setError('Video not found')
          setIsLoading(false)
          return
        }

        const data = videoDoc.data()
        // Validate required fields
        if (!data.url || !data.title) {
          setError('Invalid video data')
          setIsLoading(false)
          return
        }

        setVideo({
          ...data as VideoDetails,
          id: videoDoc.id,
        })
      } catch (error) {
        console.error('Error fetching video:', error)
        setError('Failed to load video')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideo()
  }, [videoId, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4263EB]"></div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-gray-500">{error || 'Video not found'}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="flex-none border-b border-gray-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <div className="h-6 w-[1px] bg-gray-200" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">{video.title}</h1>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="default">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="default">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="default">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-6">
          <div className="grid grid-cols-[1fr,400px] gap-8 h-full">
            {/* Left Column - Video and Details */}
            <div className="space-y-6">
              {/* Video Player */}
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  src={video.url}
                  controls
                  className="w-full h-full"
                  poster={video.thumbnail}
                />
              </div>

              {/* Summary Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
                <p className="text-gray-600">
                  {video.description || 'No description provided'}
                </p>
              </div>

              {/* Video Stats */}
              <div className="flex gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {video.duration}
                </div>
                <div className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  {video.views} views
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  0 comments
                </div>
              </div>
            </div>

            {/* Right Column - Transcript */}
            <div className="border-l border-gray-200 pl-8 h-full">
              <Tabs defaultValue="transcript" className="h-full flex flex-col">
                <TabsList className="w-full">
                  <TabsTrigger value="transcript" className="flex-1">
                    Transcript
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">
                    Activity
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="transcript" className="flex-1 mt-4">
                  <div className="bg-gray-50 rounded-lg p-4 h-full">
                    <div className="flex items-center mb-4">
                      <Input
                        type="search"
                        placeholder="Search transcript..."
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-4 overflow-auto h-[calc(100vh-400px)]">
                      {video.transcription ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {video.transcription}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No transcription available
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="activity" className="flex-1 mt-4">
                  <div className="text-sm text-gray-500 text-center py-8">
                    No activity yet
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 