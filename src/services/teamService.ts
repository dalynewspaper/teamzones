import { db } from '@/lib/firebase'
import { doc, setDoc, collection } from 'firebase/firestore'
import type { Team } from '@/types/firestore'

export async function createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
  const teamRef = doc(collection(db, 'teams'))
  
  const team: Team = {
    id: teamRef.id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await setDoc(teamRef, team)
  return team
} 