import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Team } from '@/types/teams'

export async function getTeams(organizationId: string): Promise<Team[]> {
  const teamsRef = collection(db, 'teams')
  const q = query(teamsRef, where('organizationId', '==', organizationId))
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
    }
  }) as Team[]
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const teamDoc = await getDoc(doc(db, 'teams', teamId))
  if (!teamDoc.exists()) return null
  
  const data = teamDoc.data()
  return {
    id: teamDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
  } as Team
}

export async function createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
  const now = new Date()
  const teamData = {
    ...team,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
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
    updatedAt: new Date()
  })
}

export async function deleteTeam(teamId: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', teamId))
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
  
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
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
    createdAt: now,
    updatedAt: now
  }
  
  const docRef = await addDoc(collection(db, 'teams'), teamData)
  return {
    id: docRef.id,
    ...teamData
  }
} 