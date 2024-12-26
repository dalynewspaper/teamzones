import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { UserProfile } from '@/types/firestore'

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return null
    }
    
    return userSnap.data() as UserProfile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

export async function createUserProfile(userId: string, data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = new Date().toISOString()
  const userRef = doc(db, 'users', userId)
  
  await setDoc(userRef, {
    ...data,
    id: userId,
    createdAt: now,
    updatedAt: now,
    onboardingCompleted: false
  })
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date().toISOString()
  })
} 