'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { where } from 'firebase/firestore'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { UserProfile } from '@/types/firestore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, MoreVertical, Shield, Clock } from 'lucide-react'
import { InviteMembersDialog } from './InviteMembersDialog'

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
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

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

  const handleInvitesSent = () => {
    toast({
      title: "Invites sent successfully",
      description: "Team members will receive an email invitation to join the workspace.",
    })
    setIsInviteDialogOpen(false)
  }

  if (loadingMembers) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="w-48 h-3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Workspace Members</h3>
          <p className="text-sm text-gray-500">
            Manage members and their roles in your workspace
          </p>
        </div>
        <Button 
          onClick={() => setIsInviteDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Members
        </Button>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {members.map((member) => (
          <div 
            key={member.id} 
            className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.photoURL} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                  {member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="text-lg font-medium">
                  {member.displayName || 'Unnamed Member'}
                </div>
                <div className="text-base text-gray-500 flex items-center gap-4">
                  <span>{member.email}</span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Joined {new Date(member.joinedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={member.role === 'owner' ? 'default' : 'secondary'} 
                className="h-7 px-3 text-sm"
              >
                {member.role === 'owner' ? (
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Owner
                  </div>
                ) : 'Member'}
              </Badge>
              {user?.uid === ownerId && member.id !== ownerId && (
                <Button variant="ghost" size="lg" className="h-11 w-11 p-0">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Members Dialog */}
      <InviteMembersDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvitesSent={handleInvitesSent}
      />
    </div>
  )
} 