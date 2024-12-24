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