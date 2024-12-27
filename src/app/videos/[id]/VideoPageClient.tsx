'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Share2, Copy, Clock, Calendar, Eye, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

export default function VideoPageClient() {
  const params = useParams()
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('transcript')

  useEffect(() => {
    const fetchVideo = async () => {
      if (!params.id) return

      try {
        const videoDoc = await getDoc(doc(db, 'videos', params.id as string))
        if (videoDoc.exists()) {
          setVideo({
            ...videoDoc.data() as VideoDetails,
            id: videoDoc.id,
          })
        }
      } catch (error) {
        console.error('Error fetching video:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideo()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4263EB]"></div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Video not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-[1fr,400px] gap-8">
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

            {/* Title and Actions */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Input
                    value={video.title}
                    className="text-2xl font-semibold bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    readOnly
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    {video.description || 'No description'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>

              {/* Video Stats */}
              <div className="flex gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {video.duration}
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {video.views} views
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  0 comments
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Transcript */}
          <div className="border-l border-gray-200 pl-8">
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="transcript" className="flex-1">
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">
                  Activity
                </TabsTrigger>
              </TabsList>
              <TabsContent value="transcript" className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <Input
                      type="search"
                      placeholder="Search transcript..."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-4">
                    {video.transcription ? (
                      <div className="space-y-2">
                        {/* Here you would map through transcription segments */}
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
              <TabsContent value="activity" className="mt-4">
                <div className="text-sm text-gray-500 text-center py-8">
                  No activity yet
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 