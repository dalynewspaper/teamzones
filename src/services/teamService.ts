import { db } from '@/lib/firebase'
import { doc, collection, setDoc, query, where, getDocs, getDoc, DocumentData, QueryDocumentSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import { Team } from '@/types/firestore'

export async function createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) {
  const teamsRef = collection(db, `organizations/${data.organizationId}/teams`)
  const teamRef = doc(teamsRef)
  const now = new Date().toISOString()
  
  try {
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
      name: data.name,
      description: data.description,
      organizationId: data.organizationId,
      ownerId: data.ownerId,
      members,
      isDefault: false,
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
  const q = query(
    teamsRef,
    where('isDefault', '==', true)
  )
  
  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    // If no general team exists, create it
    const userDoc = await getDoc(doc(db, 'organizations', organizationId))
    if (userDoc.exists()) {
      const ownerId = userDoc.data().ownerId
      return createGeneralTeam(organizationId, ownerId)
    }
    return null
  }
  
  // If multiple General teams exist, keep the oldest one and delete the others
  if (snapshot.docs.length > 1) {
    // Sort by creation date to find the oldest
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const aDate = new Date(a.data().createdAt)
      const bDate = new Date(b.data().createdAt)
      return aDate.getTime() - bDate.getTime()
    })

    // Keep the oldest one
    const oldestDoc = sortedDocs[0]
    
    // Delete the duplicates
    for (let i = 1; i < sortedDocs.length; i++) {
      const duplicateRef = doc(teamsRef, sortedDocs[i].id)
      await deleteDoc(duplicateRef)
    }

    return { id: oldestDoc.id, ...oldestDoc.data() } as Team
  }
  
  // Return the single General team
  const docSnapshot = snapshot.docs[0]
  const data = docSnapshot.data()
  return { id: docSnapshot.id, ...data } as Team
}

export async function getUserTeams(userId: string, organizationId: string): Promise<Team[]> {
  if (!organizationId) return []
  
  try {
    // First ensure General team exists
    await getGeneralTeam(organizationId)
    
    const teamsRef = collection(db, `organizations/${organizationId}/teams`)
    // Get all teams in the organization
    const snapshot = await getDocs(teamsRef)
    const teams = snapshot.docs.map(docSnapshot => ({ 
      id: docSnapshot.id, 
      ...docSnapshot.data() 
    })) as Team[]
    
    // Filter teams where user is a member or the team is default
    const userTeams = teams.filter(team => 
      team.isDefault || 
      team.members.some(member => member.userId === userId)
    )
    
    // Sort teams so General appears first
    return userTeams.sort((a, b) => {
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

export async function deleteTeam(
  organizationId: string,
  teamId: string
): Promise<void> {
  const teamRef = doc(db, `organizations/${organizationId}/teams/${teamId}`)
  const teamDoc = await getDoc(teamRef)
  
  if (!teamDoc.exists()) {
    throw new Error('Team not found')
  }

  const team = teamDoc.data() as Team
  if (team.isDefault) {
    throw new Error('Cannot delete the default team')
  }

  await deleteDoc(teamRef)
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