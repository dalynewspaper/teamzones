'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { where } from 'firebase/firestore'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { UserProfile } from '@/types/firestore'

interface WorkspaceMember {
  id: string
  email: string
  displayName: string
  photoURL?: string
  role: 'owner' | 'member'
  joinedAt: string
}

export function MembersTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [ownerId, setOwnerId] = useState<string>('')

  // Subscribe to organization document for owner ID
  const { data: orgData } = useFirestoreSubscription<{ ownerId: string }>(
    `organizations/${user?.organizationId}`,
    undefined,
    false
  )

  // Subscribe to users collection filtered by organization
  const { data: usersData, loading: loadingMembers } = useFirestoreSubscription<UserProfile[]>(
    'users',
    user?.organizationId ? [where('organizationId', '==', user.organizationId)] : undefined
  )

  useEffect(() => {
    if (orgData?.ownerId) {
      setOwnerId(orgData.ownerId)
    }
  }, [orgData])

  useEffect(() => {
    if (usersData && ownerId) {
      const workspaceMembers: WorkspaceMember[] = usersData.map(userData => ({
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.id === ownerId ? 'owner' : 'member',
        joinedAt: userData.createdAt
      }))

      // Sort members: owner first, then by join date
      setMembers(workspaceMembers.sort((a, b) => {
        if (a.role === 'owner') return -1
        if (b.role === 'owner') return 1
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      }))
    }
  }, [usersData, ownerId])

  // Rest of your component code...
} 