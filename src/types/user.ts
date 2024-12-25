export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted?: boolean;
  role?: 'member' | 'lead' | 'admin';
} 