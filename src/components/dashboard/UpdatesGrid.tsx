'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useWeek } from '@/contexts/WeekContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { EmptyState } from './EmptyState'

interface Update {
  id: string
  title: string
  timestamp: string
  duration: string
  views: number
  thumbnail: string
  url: string
  userId?: string
  weekId?: string
}

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em"%3EVideo Thumbnail%3C/text%3E%3C/svg%3E'

export function UpdatesGrid() {
  const router = useRouter()
  const { user } = useAuth()
  const { currentWeek } = useWeek()
  const [updates, setUpdates] = useState<Update[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUpdates = async () => {
      if (!user || !currentWeek) return

      try {
        setIsLoading(true)
        setError(null)

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
            userId: data.userId,
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

    loadUpdates()
  }, [user, currentWeek])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="aspect-video animate-pulse bg-gray-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (updates.length === 0 && currentWeek) {
    return <EmptyState weekId={currentWeek.id} />
  }

  return (
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
                  e.stopPropagation()
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
  )
} 