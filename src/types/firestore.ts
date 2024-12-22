export interface Video {
  id?: string
  title: string
  url: string
  weekId: string
  userId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  duration?: number
  thumbnailUrl?: string
}

export interface Week {
  id: string
  startDate: string
  endDate: string
  goals?: string[]
  summary?: string
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