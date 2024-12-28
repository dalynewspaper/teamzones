'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Team, TeamMember } from '@/types/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { Users, UserPlus, Settings, MoreVertical, Shield, User, X } from 'lucide-react'
import { deleteTeam } from '@/services/teamService'

interface TeamManagementProps {
  team: Team
  onClose: () => void
  onTeamUpdate: (updatedTeam: Team) => void
}

export function TeamManagement({ team, onClose, onTeamUpdate }: TeamManagementProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members')
  const [isInviting, setIsInviting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')

  const isAdmin = team.members.find(m => m.userId === user?.uid)?.role === 'admin'

  const handleInviteMember = async () => {
    if (!inviteEmail) return
    setLoading(true)
    try {
      // TODO: Implement invite member functionality
      setIsInviting(false)
      setInviteEmail('')
    } catch (err) {
      console.error('Failed to invite member:', err)
      setError('Failed to invite member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    setLoading(true)
    try {
      // TODO: Implement update member role functionality
    } catch (err) {
      console.error('Failed to update member role:', err)
      setError('Failed to update member role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true)
    try {
      // TODO: Implement remove member functionality
    } catch (err) {
      console.error('Failed to remove member:', err)
      setError('Failed to remove member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!user?.organizationId || !isAdmin || team.isDefault) return
    
    setLoading(true)
    try {
      await deleteTeam(user.organizationId, team.id)
      onClose()
    } catch (err) {
      console.error('Failed to delete team:', err)
      setError('Failed to delete team. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.name}
          </DialogTitle>
          <DialogDescription>
            {team.description || 'No description provided'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Tabs */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-2 text-sm font-medium ${
                activeTab === 'members'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Members
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-2 text-sm font-medium ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Settings
              </button>
            )}
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeTab === 'members' ? (
              <div className="space-y-6">
                {/* Invite Member Button */}
                {isAdmin && (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium">Team Members</h3>
                      <p className="text-sm text-gray-500">
                        Manage members and their roles
                      </p>
                    </div>
                    <Button onClick={() => setIsInviting(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>
                )}

                {/* Members List */}
                <div className="border rounded-lg divide-y">
                  {team.members.map((member) => (
                    <div
                      key={member.userId}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {member.userId === user?.uid ? 'You' : member.userId}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && member.userId !== user?.uid && (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(value: 'admin' | 'member') =>
                                handleUpdateMemberRole(member.userId, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isAdmin && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Shield className="h-3 w-3" />
                            {member.role}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Team Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Team Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Team Name</label>
                      <Input
                        value={team.name}
                        onChange={() => {}}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={team.description || ''}
                        onChange={() => {}}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t">
                  <h3 className="text-sm font-medium text-red-600 mb-4">
                    Danger Zone
                  </h3>
                  <Button 
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={handleDeleteTeam}
                    disabled={loading || team.isDefault}
                  >
                    {loading ? 'Deleting...' : 'Delete Team'}
                  </Button>
                  {team.isDefault && (
                    <p className="mt-2 text-sm text-gray-500">
                      The default team cannot be deleted.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
      </DialogContent>

      {/* Invite Member Dialog */}
      <Dialog open={isInviting} onOpenChange={setIsInviting}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite a new member to join the team
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email address</label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsInviting(false)
                setInviteEmail('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={loading || !inviteEmail}
            >
              {loading ? 'Inviting...' : 'Send Invite'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
} 