import { Timestamp, FieldValue } from 'firebase/firestore'

export interface Video {
  id: string
  userId: string
  title: string
  videoUrl: string
  weekId: string
  visibility: 'team' | 'private'
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
  transcript?: string
  summary?: string
  retryCount?: number
  lastError?: string
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