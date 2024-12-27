'use client'
import { useState } from 'react'
import { Star, MoreVertical, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UpdateCardProps {
  id: string
  title: string
  timestamp: string
  duration: string
  views: number
  thumbnail: string
  isStarred: boolean
  onStar?: (id: string) => void
  onDelete?: (id: string) => void
}

export function UpdateCard({
  id,
  title,
  timestamp,
  duration,
  views,
  thumbnail,
  isStarred,
  onStar,
  onDelete
}: UpdateCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
        {/* Thumbnail */}
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="lg"
            className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700"
          >
            <Play className="h-8 w-8 ml-1" />
          </Button>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-sm px-2 py-1 rounded">
          {duration}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-gray-900 flex-1 line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-yellow-500"
              onClick={() => onStar?.(id)}
            >
              <Star
                className={`h-4 w-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.origin + '/update/' + id)}>
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(id)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <span>{timestamp}</span>
          <span>{views} views</span>
        </div>
      </div>
    </div>
  )
} 