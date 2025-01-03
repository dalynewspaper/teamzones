import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { Team, TeamMember, TeamRole } from '@/types/teams'
import { sendEmail } from '@/lib/email'
import { generateInviteToken } from '@/lib/inviteToken'

// Helper to convert Firestore timestamps to dates
const convertTimestamps = (data: any) => ({
  ...data,
  createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
  updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
  metrics: data.metrics ? {
    ...data.metrics,
    lastActivityAt: data.metrics.lastActivityAt?.toDate?.() || new Date(data.metrics.lastActivityAt)
  } : undefined
})

export async function getTeams(organizationId: string, userId?: string): Promise<Team[]> {
  const teamsRef = collection(db, 'teams')
  let q = query(teamsRef, where('organizationId', '==', organizationId))
  
  // If userId is provided, only fetch teams the user has access to
  if (userId) {
    q = query(q, 
      where('visibility', '==', 'public'),
      where('members', 'array-contains', { userId })
    )
  }
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Team[]
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const teamDoc = await getDoc(doc(db, 'teams', teamId))
  if (!teamDoc.exists()) return null
  
  return {
    id: teamDoc.id,
    ...convertTimestamps(teamDoc.data())
  } as Team
}

export async function createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<Team> {
  const now = new Date()
  const teamData = {
    ...team,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    metrics: {
      completedGoalsCount: 0,
      totalGoalsCount: 0,
      taskCompletionRate: 100,
      lastActivityAt: now.toISOString()
    }
  }
  
  const docRef = await addDoc(collection(db, 'teams'), teamData)
  return {
    id: docRef.id,
    ...teamData
  }
}

export async function updateTeam(teamId: string, team: Partial<Team>): Promise<void> {
  const teamRef = doc(db, 'teams', teamId)
  await updateDoc(teamRef, {
    ...team,
    updatedAt: new Date().toISOString(),
    'metrics.lastActivityAt': new Date().toISOString()
  })
}

export async function deleteTeam(teamId: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', teamId))
}

export async function inviteMemberByEmail(
  teamId: string,
  email: string,
  role: TeamRole = 'member',
  customRole?: string
): Promise<void> {
  // Generate invitation token/link
  const inviteToken = generateInviteToken() // You'll need to implement this
  
  // Store invitation in Firestore
  await addDoc(collection(db, 'teamInvites'), {
    teamId,
    email,
    role,
    customRole,
    token: inviteToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  })
  
  // Send invitation email
  await sendEmail({
    to: email,
    subject: 'Team Invitation',
    template: 'team-invite',
    data: {
      teamId,
      inviteToken
    }
  })
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole = 'member',
  customRole?: string
): Promise<void> {
  const teamRef = doc(db, 'teams', teamId)
  const member: TeamMember = {
    userId,
    role,
    customRole,
    joinedAt: new Date().toISOString()
  }
  
  await updateDoc(teamRef, {
    members: arrayUnion(member),
    updatedAt: new Date().toISOString(),
    'metrics.lastActivityAt': new Date().toISOString()
  })
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const teamRef = doc(db, 'teams', teamId)
  const teamDoc = await getDoc(teamRef)
  if (!teamDoc.exists()) return
  
  const team = teamDoc.data() as Team
  const member = team.members.find(m => m.userId === userId)
  if (!member) return
  
  await updateDoc(teamRef, {
    members: arrayRemove(member),
    updatedAt: new Date().toISOString(),
    'metrics.lastActivityAt': new Date().toISOString()
  })
}

export async function updateTeamMetrics(teamId: string, metrics: Team['metrics']): Promise<void> {
  const teamRef = doc(db, 'teams', teamId)
  await updateDoc(teamRef, {
    metrics,
    updatedAt: new Date().toISOString(),
    'metrics.lastActivityAt': new Date().toISOString()
  })
}

export async function getGeneralTeam(organizationId: string): Promise<Team | null> {
  const teamsRef = collection(db, 'teams')
  const q = query(
    teamsRef, 
    where('organizationId', '==', organizationId),
    where('isDefault', '==', true)
  )
  const querySnapshot = await getDocs(q)
  const doc = querySnapshot.docs[0]
  
  if (!doc) return null
  
  return {
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Team
}

export async function createDefaultTeam(organizationId: string, ownerId: string): Promise<Team> {
  const now = new Date().toISOString()
  const teamData = {
    name: 'General',
    description: 'Default team for all members',
    organizationId,
    ownerId,
    members: [{
      userId: ownerId,
      role: 'admin' as const,
      joinedAt: now
    }],
    isDefault: true,
    visibility: 'public' as const,
    createdAt: now,
    updatedAt: now,
    metrics: {
      completedGoalsCount: 0,
      totalGoalsCount: 0,
      taskCompletionRate: 100,
      lastActivityAt: now
    }
  }
  
  const docRef = await addDoc(collection(db, 'teams'), teamData)
  return {
    id: docRef.id,
    ...teamData
  }
} 