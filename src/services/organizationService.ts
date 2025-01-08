import { db } from '@/lib/firebase'
import { doc, collection, setDoc, query, where, getDocs, getDoc } from 'firebase/firestore'
import { Organization } from '@/types/firestore'

export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) {
  const organizationsRef = collection(db, 'organizations')
  const organizationRef = doc(organizationsRef)
  const now = new Date().toISOString()
  
  const organization: Organization = {
    id: organizationRef.id,
    createdAt: now,
    updatedAt: now,
    ...data
  }

  await setDoc(organizationRef, organization)
  return organization
}

export async function getOrganizationByDomain(domain: string): Promise<Organization | null> {
  const q = query(collection(db, 'organizations'), where('domain', '==', domain))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Organization
}

export async function getOrganization(organizationId: string): Promise<Organization | null> {
  const orgRef = doc(db, 'organizations', organizationId)
  const orgDoc = await getDoc(orgRef)
  
  if (!orgDoc.exists()) return null
  return { id: orgDoc.id, ...orgDoc.data() } as Organization
}

export async function getWorkspaceMembers(organizationId: string) {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('organizationId', '==', organizationId))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
} 