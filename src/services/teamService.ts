import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore'
import { Team } from '@/types/firestore'

export async function createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) {
  const teamsRef = collection(db, `organizations/${data.organizationId}/teams`)
  const teamRef = doc(teamsRef)
  const now = new Date().toISOString()
  
  try {
    // Validate team name
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Team name must be at least 2 characters long')
    }

    if (data.name.trim().length > 50) {
      throw new Error('Team name must be less than 50 characters')
    }

    // Check for existing team with same name
    const existingTeamQuery = query(
      teamsRef,
      where('name', '==', data.name.trim())
    )
    const existingTeams = await getDocs(existingTeamQuery)
    if (!existingTeams.empty) {
      throw new Error('A team with this name already exists')
    }

    // First ensure General team exists and user is a member
    const generalTeam = await getGeneralTeam(data.organizationId)
    if (generalTeam && !generalTeam.members.some(m => m.userId === data.ownerId)) {
      // Add user to General team if they're not already a member
      await updateDoc(doc(teamsRef, generalTeam.id), {
        members: [...generalTeam.members, {
          userId: data.ownerId,
          role: 'member',
          joinedAt: now
        }]
      })
    }

    // Ensure members array is properly structured
    const members = data.members.map(member => ({
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt || now
    }))
    
    const team: Team = {
      id: teamRef.id,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      organizationId: data.organizationId,
      ownerId: data.ownerId,
      members,
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now
    }

    await setDoc(teamRef, team)
    return team
  } catch (error) {
    console.error('Error creating team:', error)
    throw error
  }
}

export async function createGeneralTeam(organizationId: string, ownerId: string): Promise<Team> {
  const teamsRef = collection(db, `organizations/${organizationId}/teams`)
  const teamRef = doc(teamsRef)
  const now = new Date().toISOString()
  
  const team: Team = {
    id: teamRef.id,
    name: 'General',
    description: 'Default team for all workspace members',
    organizationId,
    ownerId,
    members: [{
      userId: ownerId,
      role: 'admin',
      joinedAt: now
    }],
    isDefault: true,
    createdAt: now,
    updatedAt: now
  }

  await setDoc(teamRef, team)
  return team
}

export async function getGeneralTeam(organizationId: string): Promise<Team | null> {
  const teamsRef = collection(db, `organizations/${organizationId}/teams`)
  const q = query(teamsRef, where('isDefault', '==', true))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    return null
  }
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Team
}

export async function getUserTeams(userId: string, organizationId: string): Promise<Team[]> {
  const teamsRef = collection(db, `organizations/${organizationId}/teams`)
  
  try {
    // Get all teams in the organization
    const querySnapshot = await getDocs(teamsRef)
    const teams = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[]

    // Filter teams where user is a member
    return teams.filter(team => 
      team.members.some(member => member.userId === userId)
    ).sort((a, b) => {
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      return 0
    })
  } catch (error) {
    console.error('Error getting user teams:', error)
    return []
  }
}

export async function updateTeamMemberRole(
  organizationId: string,
  teamId: string,
  memberId: string,
  newRole: 'admin' | 'member'
): Promise<void> {
  const teamRef = doc(db, `organizations/${organizationId}/teams/${teamId}`)
  const teamDoc = await getDoc(teamRef)
  
  if (!teamDoc.exists()) {
    throw new Error('Team not found')
  }

  const team = teamDoc.data() as Team
  const memberIndex = team.members.findIndex(m => m.userId === memberId)
  
  if (memberIndex === -1) {
    throw new Error('Member not found')
  }

  // Update the member's role
  team.members[memberIndex].role = newRole
  await updateDoc(teamRef, { members: team.members })
}

export async function removeTeamMember(
  organizationId: string,
  teamId: string,
  memberId: string
): Promise<void> {
  const teamRef = doc(db, `organizations/${organizationId}/teams/${teamId}`)
  const teamDoc = await getDoc(teamRef)
  
  if (!teamDoc.exists()) {
    throw new Error('Team not found')
  }

  const team = teamDoc.data() as Team
  const updatedMembers = team.members.filter(m => m.userId !== memberId)
  
  await updateDoc(teamRef, { members: updatedMembers })
}

export async function updateTeamSettings(
  organizationId: string,
  teamId: string,
  updates: {
    name?: string
    description?: string
  }
): Promise<void> {
  const teamRef = doc(db, `organizations/${organizationId}/teams/${teamId}`)
  await updateDoc(teamRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  })
}

export async function deleteTeam(organizationId: string, teamId: string) {
  const teamRef = doc(db, `organizations/${organizationId}/teams/${teamId}`)
  
  try {
    // Get team data first to check if it's the default team
    const teamSnap = await getDoc(teamRef)
    if (!teamSnap.exists()) {
      throw new Error('Team not found')
    }

    const teamData = teamSnap.data() as Team
    if (teamData.isDefault) {
      throw new Error('Cannot delete the default team')
    }

    await deleteDoc(teamRef)
  } catch (error) {
    console.error('Error deleting team:', error)
    throw error
  }
}

export async function inviteTeamMember(
  organizationId: string,
  teamId: string,
  email: string
): Promise<void> {
  // First check if user exists
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('email', '==', email))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    throw new Error('User not found. Please ensure they have signed up first.')
  }

  const userId = snapshot.docs[0].id
  const teamRef = doc(db, `organizations/${organizationId}/teams/${teamId}`)
  const teamDoc = await getDoc(teamRef)
  
  if (!teamDoc.exists()) {
    throw new Error('Team not found')
  }

  const team = teamDoc.data() as Team
  if (team.members.some(m => m.userId === userId)) {
    throw new Error('User is already a member of this team')
  }

  // Add the new member
  team.members.push({
    userId,
    role: 'member',
    joinedAt: new Date().toISOString()
  })

  await updateDoc(teamRef, { members: team.members })
} 