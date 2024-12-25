import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import type { UserProfile } from '@/types/firestore';

export async function createUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid)
  
  // Check if user already exists
  const userDoc = await getDoc(userRef)
  if (userDoc.exists()) {
    return // Don't create new profile for existing users
  }

  const userProfile: UserProfile = {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    onboardingCompleted: false,
    role: 'member' // Add default role
  }
  
  await setDoc(userRef, userProfile)
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile
  }
  
  return null
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true })
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update user profile')
  }
} 