import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

interface PersonalSettings {
  firstName: string
  lastName: string
  photoURL: string
  email: string
  notifications: {
    email: boolean
    desktop: boolean
    mobile: boolean
  }
  recordingQuality: string
  theme: 'light' | 'dark' | 'system'
}

interface OrganizationSettings {
  name: string
  domain: string
  logo: string
  weekStartDay: string
  allowedDomains: string[]
  dateFormat: string
}

export async function updatePersonalSettings(userId: string, settings: Partial<PersonalSettings>) {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    firstName: settings.firstName,
    lastName: settings.lastName,
    photoURL: settings.photoURL,
    'settings.notifications': settings.notifications,
    'settings.recordingQuality': settings.recordingQuality,
    'settings.theme': settings.theme
  })
}

export async function updateOrganizationSettings(organizationId: string | null, settings: Partial<OrganizationSettings>) {
  if (!organizationId) {
    throw new Error('No organization ID provided')
  }
  
  const orgRef = doc(db, 'organizations', organizationId)
  await updateDoc(orgRef, {
    name: settings.name,
    domain: settings.domain,
    logo: settings.logo,
    'settings.weekStartDay': settings.weekStartDay,
    'settings.allowedDomains': settings.allowedDomains,
    'settings.dateFormat': settings.dateFormat
  })
}

export async function getPersonalSettings(userId: string): Promise<PersonalSettings | null> {
  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)
  
  if (!userDoc.exists()) {
    return null
  }

  const data = userDoc.data()
  return {
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    photoURL: data.photoURL || '',
    email: data.email || '',
    notifications: data.settings?.notifications || {
      email: true,
      desktop: true,
      mobile: true
    },
    recordingQuality: data.settings?.recordingQuality || '720p',
    theme: data.settings?.theme || 'light'
  }
}

export async function getOrganizationSettings(organizationId: string | null): Promise<OrganizationSettings | null> {
  if (!organizationId) {
    return null
  }

  const orgRef = doc(db, 'organizations', organizationId)
  const orgDoc = await getDoc(orgRef)
  
  if (!orgDoc.exists()) {
    return null
  }

  const data = orgDoc.data()
  return {
    name: data.name || '',
    domain: data.domain || '',
    logo: data.logo || '',
    weekStartDay: data.settings?.weekStartDay || '1',
    allowedDomains: data.settings?.allowedDomains || [],
    dateFormat: data.settings?.dateFormat || 'MM/dd/yyyy'
  }
} 