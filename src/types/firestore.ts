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

export interface UserProfile {
  id: string
  email: string
  displayName: string
  title?: string
  photoURL?: string
  createdAt: string
  updatedAt: string
  organizationId?: string
  teamId?: string
  timezone?: string
  lastActive?: string
  onboardingCompleted: boolean
  settings?: {
    theme?: 'light' | 'dark' | 'system'
    emailNotifications?: boolean
  }
}

export interface Video {
  id: string;
  userId: string;
  weekId: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration: number;
  timestamp: Date;
  views: number;
  isStarred: boolean;
  createdAt: string;
  transcription?: string;
}

export interface Organization {
  id: string
  name: string
  domain: string
  employeeCount: string
  ownerId: string
  createdAt: string
  updatedAt: string
  settings: {
    allowedDomains: string[]
    weekStartDay: number
  }
  branding?: {
    logo?: string
    icon?: string
    colors?: string[]
  }
}

export interface Team {
  id: string
  name: string
  organizationId: string
  ownerId: string
  createdAt: string
  updatedAt: string
  members: {
    userId: string
    role: 'admin' | 'member'
    joinedAt: string
  }[]
} 