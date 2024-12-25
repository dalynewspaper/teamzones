import { db } from '@/lib/firebase'
import { doc, setDoc, collection, query, getDocs, where } from 'firebase/firestore'
import type { Organization } from '@/types/firestore'

export async function createOrganization(data: Omit<Organization, 'id'>): Promise<Organization> {
  try {
    // Create a new doc reference with auto-generated ID
    const orgRef = doc(collection(db, 'organizations'))
    
    // Clean up the data by removing undefined values
    const cleanData = {
      ...data,
      branding: data.branding ? {
        ...(data.branding.logo && { logo: data.branding.logo }),
        ...(data.branding.icon && { icon: data.branding.icon }),
        ...(data.branding.colors?.length && { colors: data.branding.colors })
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Remove undefined values from the root level
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key]
      }
    })

    // Add the document to Firestore
    await setDoc(orgRef, cleanData)

    // Return the created organization with its ID
    return {
      id: orgRef.id,
      ...cleanData
    }
  } catch (error) {
    console.error('Error creating organization:', error)
    throw new Error('Failed to create organization')
  }
}

export async function getOrganizationByDomain(domain: string): Promise<Organization | null> {
  const q = query(collection(db, 'organizations'), where('domain', '==', domain))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Organization
} 