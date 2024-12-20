'use client'
import { EyeIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline'

interface Video {
  id: string
  title: string
  thumbnail: string
  duration: string
  createdAt: string
  views: number
  comments: number
  likes: number
  isShared: boolean
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div key={video.id} className="bg-white rounded-lg overflow-hidden shadow-sm border">
          <div className="relative">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
            <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </span>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{video.title}</h3>
              <button className="text-gray-500 text-sm">
                Not shared ▼
              </button>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <div className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                {video.views}
              </div>
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                {video.comments}
              </div>
              <div className="flex items-center">
                <HeartIcon className="h-4 w-4 mr-1" />
                {video.likes}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 