'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { inviteTeamMember } from '@/services/teamService'
import { useToast } from '@/components/ui/use-toast'
import { UserPlus, Mail, User, Crown } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'

interface WorkspaceMember {
  id: string
  email: string
  displayName: string
  photoURL?: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

export function MembersTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  useEffect(() => {
    async function loadWorkspaceMembers() {
      if (!user?.organizationId) return

      try {
        setLoadingMembers(true)
        // Get organization doc first
        const orgDoc = await getDoc(doc(db, 'organizations', user.organizationId))
        const ownerId = orgDoc.data()?.ownerId

        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('organizationId', '==', user.organizationId))
        const querySnapshot = await getDocs(q)
        
        const workspaceMembers: WorkspaceMember[] = []
        querySnapshot.forEach((doc) => {
          const userData = doc.data()
          workspaceMembers.push({
            id: doc.id,
            email: userData.email,
            displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim(),
            photoURL: userData.photoURL,
            role: doc.id === ownerId ? 'owner' : 'member',
            joinedAt: userData.createdAt || new Date().toISOString()
          })
        })

        // Sort members: owner first, then by join date
        setMembers(workspaceMembers.sort((a, b) => {
          if (a.role === 'owner') return -1
          if (b.role === 'owner') return 1
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        }))
      } catch (error) {
        console.error('Error loading workspace members:', error)
        toast({
          title: 'Error',
          description: 'Failed to load workspace members',
          variant: 'destructive',
        })
      } finally {
        setLoadingMembers(false)
      }
    }

    loadWorkspaceMembers()
  }, [user?.organizationId, toast])

  const handleInvite = async () => {
    if (!user?.organizationId || !email) return
    setLoading(true)

    try {
      await inviteTeamMember(user.organizationId, 'general', email)
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${email}`,
      })
      setEmail('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">Current Members</h2>
        <div className="border rounded-lg divide-y">
          {loadingMembers ? (
            <div className="p-4 text-sm text-gray-500">Loading members...</div>
          ) : members.length > 0 ? (
            members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {member.photoURL ? (
                    <img 
                      src={member.photoURL} 
                      alt={member.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{member.displayName}</span>
                      {member.role === 'owner' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{member.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-gray-500">No members found</div>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-medium mb-2">Invite Members</h2>
        <p className="text-sm text-gray-500 mb-4">
          Invite new members to join your workspace
        </p>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <Button 
            onClick={handleInvite}
            disabled={loading || !email}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-medium mb-4">Pending Invitations</h3>
        {/* TODO: Add pending invitations list */}
      </div>
    </div>
  )
} 