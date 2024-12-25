export interface BaseDocument {
  id: string
  createdAt: string
  updatedAt: string
}

export interface VideoUpdate {
  userId: string | undefined
  id: string
  url: string
  createdAt: string
  status: 'processing' | 'ready' | 'error'
  weekId: string
  duration: number
}

export interface Week extends BaseDocument {
  startDate: string
  endDate: string
  status: 'active' | 'archived'
  videos: VideoUpdate[]
}

export interface UserProfile extends BaseDocument {
  email: string
  displayName: string | null
  photoURL: string | null
  onboardingCompleted?: boolean
  role: 'admin' | 'member'
  organizationId?: string
  teamId?: string
}

export interface Video extends BaseDocument {
  title: string
  url: string
  thumbnailUrl: string
  weekId: string
  userId: string
  status: 'processing' | 'ready' | 'failed'
  duration?: number
}

export interface Organization {
  id: string
  name: string
  domain: string
  createdAt: string
  updatedAt: string
  ownerId: string
  settings?: {
    allowedDomains?: string[]
    weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday
  }
}

export interface Team {
  id: string
  name: string
  organizationId: string
  createdAt: string
  updatedAt: string
  leaderId: string
  members: {
    userId: string
    role: 'admin' | 'member'
    joinedAt: string
  }[]
} 