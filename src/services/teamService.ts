import { db } from '@/lib/firebase'
import { doc, collection, setDoc } from 'firebase/firestore'
import { Team } from '@/types/firestore'

export async function createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) {
  const teamsRef = collection(db, 'teams')
  const teamRef = doc(teamsRef)
  const now = new Date().toISOString()
  
  const team: Team = {
    id: teamRef.id,
    createdAt: now,
    updatedAt: now,
    ...data
  }

  await setDoc(teamRef, team)
  return team
} 