import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, Timestamp, doc, getDoc, DocumentData } from 'firebase/firestore'
import { generateInviteToken } from '@/lib/inviteToken'

interface InviteData {
  email: string
  organizationId: string
  invitedBy: string
  role?: 'member' | 'admin'
  status: 'pending' | 'accepted' | 'declined'
}

interface InviteLinkData {
  token: string
  organizationId: string
  invitedBy: string
  createdAt: Timestamp
  expiresAt: Timestamp
  isActive: boolean
}

interface OrganizationData extends DocumentData {
  name: string
  ownerId: string
  members: string[]
}

interface UserData extends DocumentData {
  displayName: string
  email: string
  photoURL?: string
}

function isOrganizationData(data: DocumentData | undefined): data is OrganizationData {
  return data !== undefined && 
         typeof data.name === 'string' && 
         typeof data.ownerId === 'string' && 
         Array.isArray(data.members)
}

function isUserData(data: DocumentData | undefined): data is UserData {
  return data !== undefined && 
         typeof data.displayName === 'string' && 
         typeof data.email === 'string'
}

export async function inviteMember(data: Omit<InviteData, 'status'>) {
  try {
    // Check if invite already exists
    const invitesRef = collection(db, 'invites')
    const q = query(
      invitesRef,
      where('email', '==', data.email),
      where('organizationId', '==', data.organizationId),
      where('status', '==', 'pending')
    )
    const existingInvites = await getDocs(q)
    
    if (!existingInvites.empty) {
      throw new Error('An invitation has already been sent to this email')
    }

    // Create new invite
    const invite: InviteData = {
      ...data,
      role: data.role || 'member',
      status: 'pending'
    }

    await addDoc(collection(db, 'invites'), {
      ...invite,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    return invite
  } catch (error) {
    console.error('Error inviting member:', error)
    throw error
  }
}

export async function getPendingInvites(organizationId: string) {
  try {
    const invitesRef = collection(db, 'invites')
    const q = query(
      invitesRef,
      where('organizationId', '==', organizationId),
      where('status', '==', 'pending')
    )
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting pending invites:', error)
    throw error
  }
}

export async function generateInviteLink(organizationId: string, invitedBy: string) {
  try {
    const token = generateInviteToken()
    
    // Get organization details
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId))
    const orgData = orgDoc.data()
    
    if (!orgDoc.exists() || !isOrganizationData(orgData)) {
      throw new Error('Organization not found or invalid data')
    }
    
    // Get inviter details
    const inviterDoc = await getDoc(doc(db, 'users', invitedBy))
    const inviterData = inviterDoc.data()
    
    if (!inviterDoc.exists() || !isUserData(inviterData)) {
      throw new Error('Inviter not found or invalid data')
    }

    // Create a new invite link document
    const inviteLinkData: InviteLinkData = {
      token,
      organizationId,
      invitedBy,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      isActive: true
    }

    await addDoc(collection(db, 'inviteLinks'), inviteLinkData)

    // Return the invite link with org and inviter info
    const params = new URLSearchParams({
      token,
      org: orgData.name,
      inviter: inviterData.displayName
    })
    
    // Use window.location.origin if available, otherwise fallback to a default
    const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || ''
    return `${origin}/join?${params.toString()}`
  } catch (error) {
    console.error('Error generating invite link:', error)
    throw error
  }
}

export async function validateInviteLink(token: string): Promise<{ organizationId: string; invitedBy: string }> {
  try {
    const inviteLinksRef = collection(db, 'inviteLinks')
    const q = query(inviteLinksRef, where('token', '==', token), where('isActive', '==', true))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Invalid or expired invite link')
    }

    const inviteLink = snapshot.docs[0].data() as InviteLinkData
    
    // Check if link has expired
    if (inviteLink.expiresAt.toDate() < new Date()) {
      throw new Error('Invite link has expired')
    }

    return {
      organizationId: inviteLink.organizationId,
      invitedBy: inviteLink.invitedBy
    }
  } catch (error) {
    console.error('Error validating invite link:', error)
    throw error
  }
} 