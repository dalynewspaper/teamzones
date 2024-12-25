import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/firestore';

interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
}

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
    onboardingCompleted: false
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
  data: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'users', userId)
  await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  }, { merge: true })
} 