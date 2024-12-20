'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { WeekNavigator } from '@/components/dashboard/WeekNavigator'
import { ContentHeader } from '@/components/dashboard/ContentHeader'
import { VideoGrid } from '@/components/dashboard/VideoGrid'
import { EmptyState } from '@/components/dashboard/EmptyState'

const dummyVideos: any[] = [] // Set to empty array to test empty state

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <WeekNavigator />
          <ContentHeader />
          {dummyVideos.length > 0 ? (
            <VideoGrid videos={dummyVideos} />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  )
} 