import { db } from '@/lib/firebase'
import { doc, setDoc, collection, query, getDocs, where } from 'firebase/firestore'
import type { Organization } from '@/types/firestore'

export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
  const orgRef = doc(collection(db, 'organizations'))
  
  const organization: Organization = {
    id: orgRef.id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await setDoc(orgRef, organization)
  return organization
}

export async function getOrganizationByDomain(domain: string): Promise<Organization | null> {
  const q = query(collection(db, 'organizations'), where('domain', '==', domain))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Organization
} 