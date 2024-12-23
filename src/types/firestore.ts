export interface Video {
  id: string
  userId: string
  title: string
  description?: string
  transcript?: string
  summary?: string
  videoUrl: string
  thumbnailUrl?: string
  createdAt: Date
  updatedAt: Date
  weekId: string
  visibility: 'team' | 'private'
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  processedAt?: Date
}

export interface Week {
  id: string
  startDate: Date
  endDate: Date
  videos: string[] // Array of video IDs
}

export interface Workspace {
  id: string
  name: string
  members: {
    [userId: string]: {
      role: 'admin' | 'member'
      joinedAt: string
    }
  }
} 