import { useEffect, useState } from 'react'
import { UserProfile } from '@/types/user'
import { getWorkspaceMembers } from '@/services/organizationService'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface MembersListProps {
  organizationId: string
}

export function MembersList({ organizationId }: MembersListProps) {
  const [members, setMembers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const workspaceMembers = await getWorkspaceMembers(organizationId)
        setMembers(workspaceMembers)
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [organizationId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No members found in this workspace
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={member.photoURL || undefined} />
              <AvatarFallback>
                {member.email?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {member.name || 'No name set'}
              </div>
              <div className="text-sm text-muted-foreground">
                {member.email}
              </div>
            </div>
          </div>
          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
            {member.role === 'admin' ? 'Admin' : 'Member'}
          </Badge>
        </div>
      ))}
    </div>
  )
} 