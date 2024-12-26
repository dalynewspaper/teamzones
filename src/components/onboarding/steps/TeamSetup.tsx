'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useAuth } from '@/contexts/AuthContext'
import { createOrganization } from '@/services/organizationService'
import { createTeam } from '@/services/teamService'
import { updateUserProfile } from '@/services/userService'

export function TeamSetup() {
  const { completeStep } = useOnboarding()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [teamData, setTeamData] = useState({
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Create organization
      const organization = await createOrganization({
        name: teamData.name,
        domain: user.email?.split('@')[1] || '',
        employeeCount: '1-10',
        ownerId: user.uid,
        settings: {
          allowedDomains: [user.email?.split('@')[1] || ''],
          weekStartDay: 1
        }
      })

      // Create default team
      const team = await createTeam({
        name: 'General',
        organizationId: organization.id,
        ownerId: user.uid,
        members: [{
          userId: user.uid,
          role: 'admin',
          joinedAt: new Date().toISOString()
        }]
      })

      // Update user profile with organization and team
      await updateUserProfile(user.uid, {
        organizationId: organization.id,
        teamId: team.id
      })

      completeStep('organization')
    } catch (err) {
      console.error('Setup error:', err)
      setError('Failed to create team. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Create Your Team</h3>
          <p className="text-sm text-gray-500">
            Set up your team workspace
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Team Name</label>
            <Input
              required
              value={teamData.name}
              onChange={(e) => setTeamData(d => ({ ...d, name: e.target.value }))}
              placeholder="My Team"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Team...' : 'Create Team'}
      </Button>
    </form>
  )
} 