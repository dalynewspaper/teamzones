import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { validateInviteLink } from '@/services/inviteService'
import { doc, updateDoc, arrayUnion, getDoc, DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface OrganizationData extends DocumentData {
  name: string
  ownerId: string
  members: string[]
}

interface UserData extends DocumentData {
  displayName: string
  email: string
  organizationId?: string
  photoURL?: string
  teams?: string[]
  defaultTeam?: string
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

export function JoinWorkspace({ token }: { token: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const joinWorkspace = async () => {
      if (!user?.uid) return

      try {
        // Validate the invite link
        const { organizationId } = await validateInviteLink(token)

        // Get organization data to verify it exists
        const orgRef = doc(db, 'organizations', organizationId)
        const orgDoc = await getDoc(orgRef)
        const orgData = orgDoc.data()
        
        if (!orgDoc.exists() || !isOrganizationData(orgData)) {
          throw new Error('Organization not found or invalid data')
        }

        // Check if user is already a member
        if (orgData.members.includes(user.uid)) {
          router.replace('/dashboard')
          return
        }

        // Add user to organization members
        await updateDoc(orgRef, {
          members: arrayUnion(user.uid)
        })

        // Update user's organization
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)
        const userData = userDoc.data()
        
        if (!userDoc.exists() || !isUserData(userData)) {
          throw new Error('User profile not found or invalid data')
        }

        // Update user with organization and add to general team
        await updateDoc(userRef, {
          organizationId,
          teams: userData.teams || [],
          defaultTeam: userData.defaultTeam || null
        })

        // Redirect to dashboard
        router.replace('/dashboard')
      } catch (err) {
        console.error('Error joining workspace:', err)
        setError(err instanceof Error ? err.message : 'Failed to join workspace')
      }
    }

    joinWorkspace()
  }, [user, token, router])

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600 mb-2">{error}</div>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Return to home
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="text-gray-600">Joining workspace...</span>
      </div>
    </div>
  )
} 