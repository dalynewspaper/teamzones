export interface BaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video extends BaseDocument {
  title: string;
  url: string;
  thumbnailUrl: string;
  weekId: string;
  userId: string;
  status: 'processing' | 'ready' | 'failed';
  duration?: number;
}

export interface Week extends BaseDocument {
  startDate: string;
  endDate: string;
  status: 'active' | 'archived';
  videos: VideoUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends BaseDocument {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  settings?: {
    emailNotifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

export interface VideoUpdate {
  id: string;
  url: string;
  createdAt: string;
  status: 'processing' | 'ready' | 'error';
  weekId: string;
  duration: number;
}

export interface Week {
  id: string
  startDate: string
  endDate: string
  videos: VideoUpdate[]
  // ... other week fields
} 