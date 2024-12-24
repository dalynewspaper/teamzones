import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocument, createDocument, updateDocument, type UpdateData } from './firestoreService';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types/firestore';

export async function createUserProfile(user: User): Promise<void> {
  const existingUser = await getDocument<UserProfile>('users', user.uid);

  if (!existingUser) {
    const userData: Omit<UserProfile, 'id'> = {
      email: user.email!,
      displayName: user.displayName,
      photoURL: user.photoURL,
      settings: {
        emailNotifications: true,
        theme: 'system'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createDocument('users', userData);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return getDocument<UserProfile>('users', userId);
}

export async function updateUserProfile(
  userId: string,
  data: UpdateData<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  await updateDocument<UserProfile>('users', userId, data);
}

export async function updateUserSettings(
  userId: string,
  settings: UserProfile['settings']
): Promise<void> {
  await updateDocument<UserProfile>('users', userId, { settings });
} 