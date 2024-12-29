import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'

interface InviteData {
  email: string
  organizationId: string
  invitedBy: string
  role?: 'member' | 'admin'
  status: 'pending' | 'accepted' | 'declined'
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

    // TODO: Send invitation email
    // This would typically integrate with your email service
    // For now, we'll just log it
    console.log(`Invitation sent to ${data.email}`)

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