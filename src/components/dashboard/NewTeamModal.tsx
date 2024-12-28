import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { createTeam } from '@/services/teamService'

interface NewTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamCreated?: () => void
}

export function NewTeamModal({ isOpen, onClose, onTeamCreated }: NewTeamModalProps) {
  const { user } = useAuth()
  const [teamName, setTeamName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.organizationId) return

    try {
      setIsLoading(true)
      setError(null)

      if (!teamName.trim()) {
        setError('Team name is required')
        return
      }

      const now = new Date().toISOString()
      await createTeam({
        name: teamName.trim(),
        organizationId: user.organizationId,
        ownerId: user.uid,
        members: [{
          userId: user.uid,
          role: 'admin',
          joinedAt: now
        }],
        isDefault: false
      })

      setTeamName('')
      onTeamCreated?.()
      onClose()
    } catch (err) {
      console.error('Error creating team:', err)
      setError('Failed to create team. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Add a new team to your organization. Team members can be added in team settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#4263EB] hover:bg-[#3b5bdb] text-white"
            >
              {isLoading ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 