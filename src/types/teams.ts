export interface TeamMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
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
} 