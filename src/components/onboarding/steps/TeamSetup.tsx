'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useAuth } from '@/contexts/AuthContext'
import { createOrganization } from '@/services/organizationService'
import { createTeam } from '@/services/teamService'

type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const COMMON_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'msn.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'yandex.com',
  'mail.com',
  'gmx.com',
  'fastmail.com'
]);

function extractOrgInfo(email: string | null) {
  if (!email) return { name: '', domain: '' }
  
  const domain = email.split('@')[1]
  if (!domain) return { name: '', domain: '' }

  // Don't suggest organization name for common email providers
  if (COMMON_EMAIL_PROVIDERS.has(domain.toLowerCase())) {
    return { name: '', domain: '' }
  }

  // Convert domain to organization name
  const name = domain
    .split('.')[0]                     // Get first part of domain
    .split('-').join(' ')             // Replace hyphens with spaces
    .split('_').join(' ')             // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim()

  return { name, domain }
}

export function TeamSetup() {
  const { completeStep } = useOnboarding()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [orgData, setOrgData] = useState({
    name: '',
    domain: ''
  })
  
  // Auto-fill organization data from email
  useEffect(() => {
    if (user?.email) {
      const { name, domain } = extractOrgInfo(user.email)
      setOrgData({
        name: name || '',
        domain: domain || ''
      })
    }
  }, [user?.email])
  
  const [teamData, setTeamData] = useState({
    name: 'Leadership Team', // Default team name
    weekStartDay: 1 as WeekStartDay
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Create organization first
      const organization = await createOrganization({
        name: orgData.name,
        domain: orgData.domain,
        ownerId: user.uid,
        settings: {
          allowedDomains: [orgData.domain],
          weekStartDay: teamData.weekStartDay // Now correctly typed
        }
      })

      // Then create the default team
      await createTeam({
        name: teamData.name,
        organizationId: organization.id,
        leaderId: user.uid,
        members: [{
          userId: user.uid,
          role: 'admin',
          joinedAt: new Date().toISOString()
        }]
      })

      completeStep('team')
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
          <h3 className="text-lg font-medium">Organization Setup</h3>
          <p className="text-sm text-gray-500">
            Let's set up your organization and team
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Organization Name</label>
            <Input
              required
              value={orgData.name}
              onChange={(e) => setOrgData(d => ({ ...d, name: e.target.value }))}
              placeholder="Acme Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Company Domain</label>
            <Input
              required
              type="text"
              value={orgData.domain}
              onChange={(e) => setOrgData(d => ({ ...d, domain: e.target.value }))}
              placeholder="acme.com"
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be used to verify team members
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Team Name</label>
            <Input
              required
              value={teamData.name}
              onChange={(e) => setTeamData(d => ({ ...d, name: e.target.value }))}
              placeholder="Leadership Team"
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
        {loading ? 'Creating...' : 'Create Organization & Team'}
      </Button>
    </form>
  )
} 