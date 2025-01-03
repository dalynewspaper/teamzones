import { auth } from '@/lib/firebase'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface User {
  id: string
  email: string
  organizationId: string
  name?: string
  role: 'admin' | 'member'
}

export async function getCurrentUser(): Promise<User | null> {
  const currentUser = auth.currentUser
  if (!currentUser) return null

  const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
  if (!userDoc.exists()) return null

  const userData = userDoc.data()
  return {
    id: currentUser.uid,
    email: currentUser.email!,
    organizationId: userData.organizationId,
    name: userData.name,
    role: userData.role
  }
} 