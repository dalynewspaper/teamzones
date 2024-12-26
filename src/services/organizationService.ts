import { db } from '@/lib/firebase'
import { doc, collection, setDoc, query, where, getDocs } from 'firebase/firestore'
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