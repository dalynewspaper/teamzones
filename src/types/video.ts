export interface Video {
  id: string
  userId: string
  weekId: string
  url?: string
  thumbnailUrl?: string
  transcript?: string
  summary?: string
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
} 