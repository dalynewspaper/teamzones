import { db } from '@/lib/firebase'
import { doc, setDoc, collection } from 'firebase/firestore'
import type { Team } from '@/types/firestore'

export async function createTeam(data: Omit<Team, 'id'>): Promise<Team> {
  try {
    // Create a new doc reference with auto-generated ID
    const teamRef = doc(collection(db, 'teams'))
    
    // Add the document to Firestore
    await setDoc(teamRef, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Return the created team with its ID
    return {
      id: teamRef.id,
      ...data
    }
  } catch (error) {
    console.error('Error creating team:', error)
    throw new Error('Failed to create team')
  }
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<void> {
  try {
    const teamRef = doc(db, 'teams', id)
    await setDoc(teamRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true })
  } catch (error) {
    console.error('Error updating team:', error)
    throw new Error('Failed to update team')
  }
} 