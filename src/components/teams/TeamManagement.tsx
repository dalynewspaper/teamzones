"use client"
import { useState } from 'react'
import { Team, TeamRole, TeamVisibility } from '@/types/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { createTeam, updateTeam, deleteTeam, inviteMemberByEmail } from '@/services/teamService'

interface TeamManagementProps {
  organizationId: string;
  currentUserId: string;
  onTeamCreated?: (team: Team) => void;
  onTeamUpdated?: (team: Team) => void;
  onTeamDeleted?: (teamId: string) => void;
}

export function TeamManagement({
  organizationId,
  currentUserId,
  onTeamCreated,
  onTeamUpdated,
  onTeamDeleted
}: TeamManagementProps) {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [teamVisibility, setTeamVisibility] = useState<TeamVisibility>('public')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('member')
  const [customRole, setCustomRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateTeam = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const team = await createTeam({
        name: teamName,
        description: teamDescription,
        organizationId,
        ownerId: currentUserId,
        visibility: teamVisibility,
        members: [{
          userId: currentUserId,
          role: 'admin',
          joinedAt: new Date().toISOString()
        }]
      })

      onTeamCreated?.(team)
      setTeamName('')
      setTeamDescription('')
      setTeamVisibility('public')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteMember = async (teamId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      await inviteMemberByEmail(teamId, inviteEmail, inviteRole, customRole)
      setInviteEmail('')
      setInviteRole('member')
      setCustomRole('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Team</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div>
            <Label htmlFor="teamDescription">Description (Optional)</Label>
            <Input
              id="teamDescription"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Enter team description"
            />
          </div>

          <div>
            <Label htmlFor="teamVisibility">Visibility</Label>
            <Select value={teamVisibility} onValueChange={(value: TeamVisibility) => setTeamVisibility(value)}>
              <SelectTrigger id="teamVisibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button
            onClick={handleCreateTeam}
            disabled={!teamName || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Team'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="inviteEmail">Email Address</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label htmlFor="inviteRole">Role</Label>
            <Select value={inviteRole} onValueChange={(value: TeamRole) => setInviteRole(value)}>
              <SelectTrigger id="inviteRole">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="lead">Team Lead</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customRole">Custom Role (Optional)</Label>
            <Input
              id="customRole"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="E.g., Lead Designer"
            />
          </div>

          <Button
            onClick={() => handleInviteMember('TEAM_ID')} // Replace with actual team ID
            disabled={!inviteEmail || isLoading}
          >
            {isLoading ? 'Inviting...' : 'Send Invitation'}
          </Button>
        </div>
      </Card>
    </div>
  )
} 