"use client"
import { useState } from 'react'
import { Team, TeamMember, TeamRole } from '@/types/teams'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { removeTeamMember, updateTeam } from '@/services/teamService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TeamDetailsProps {
  team: Team;
  currentUserId: string;
  onTeamUpdated?: (team: Team) => void;
  onMemberRemoved?: (userId: string) => void;
}

export function TeamDetails({
  team,
  currentUserId,
  onTeamUpdated,
  onMemberRemoved
}: TeamDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = team.members.some(m => m.userId === currentUserId && m.role === 'admin')

  const handleRemoveMember = async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      await removeTeamMember(team.id, userId)
      onMemberRemoved?.(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMemberRole = async (userId: string, role: TeamRole) => {
    try {
      setIsLoading(true)
      setError(null)

      const updatedMembers = team.members.map(member =>
        member.userId === userId ? { ...member, role } : member
      )

      await updateTeam(team.id, { members: updatedMembers })
      onTeamUpdated?.({ ...team, members: updatedMembers })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">{team.name}</h2>
          {team.description && (
            <p className="text-gray-600 mt-2">{team.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={team.visibility === 'public' ? 'default' : 'secondary'}>
              {team.visibility}
            </Badge>
            {team.isDefault && (
              <Badge variant="outline">Default Team</Badge>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Team Members</h3>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}

          <div className="space-y-4">
            {team.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`/api/avatar/${member.userId}`} alt={member.userId} />
                    <AvatarFallback>
                      {member.userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.userId}</div>
                    {member.customRole && (
                      <div className="text-sm text-gray-500">{member.customRole}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && member.userId !== currentUserId && (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(value: TeamRole) => handleUpdateMemberRole(member.userId, value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="lead">Team Lead</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                  {(!isAdmin || member.userId === currentUserId) && (
                    <Badge>{member.role}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {team.metrics && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Team Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Completed Goals</div>
                <div className="text-2xl font-semibold">
                  {team.metrics.completedGoalsCount} / {team.metrics.totalGoalsCount}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Task Completion Rate</div>
                <div className="text-2xl font-semibold">
                  {team.metrics.taskCompletionRate}%
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Last Activity</div>
                <div className="text-lg font-semibold">
                  {new Date(team.metrics.lastActivityAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
} 