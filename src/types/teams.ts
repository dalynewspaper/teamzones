export type TeamRole = 'admin' | 'lead' | 'member';
export type TeamVisibility = 'public' | 'private';

export interface TeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: string;
  customRole?: string; // Optional custom role title (e.g. "Lead Designer")
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  isDefault?: boolean;
  visibility: TeamVisibility;
  linkedGoalIds?: string[]; // IDs of goals associated with this team
  metrics?: {
    completedGoalsCount: number;
    totalGoalsCount: number;
    taskCompletionRate: number;
    lastActivityAt: string;
  };
} 