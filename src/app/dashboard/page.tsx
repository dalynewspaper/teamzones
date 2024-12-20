'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ContentHeader } from '@/components/dashboard/ContentHeader'
import { VideoGrid } from '@/components/dashboard/VideoGrid'

const dummyVideos = [
  {
    id: '1',
    title: 'iOS Mobile Upload',
    thumbnail: '/placeholder.jpg',
    duration: '1 min',
    createdAt: '3 years ago',
    views: 0,
    comments: 0,
    likes: 0,
    isShared: false
  },
  // Add more dummy videos as needed
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <ContentHeader />
          <VideoGrid videos={dummyVideos} />
        </div>
      </main>
    </div>
  )
} 