'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { WeekNavigator } from '@/components/dashboard/WeekNavigator'
import { ContentHeader } from '@/components/dashboard/ContentHeader'
import { VideoGrid } from '@/components/dashboard/VideoGrid'

const dummyVideos = [
  {
    id: '1',
    title: 'Weekly Update - Sprint Planning',
    thumbnail: '/placeholder.jpg',
    duration: '3 min',
    createdAt: 'Today',
    views: 5,
    comments: 2,
    likes: 3,
    isShared: true
  },
  // Add more dummy videos
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <WeekNavigator />
          <ContentHeader />
          <VideoGrid videos={dummyVideos} />
        </div>
      </main>
    </div>
  )
} 