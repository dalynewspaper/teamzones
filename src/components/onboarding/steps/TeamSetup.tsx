'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useAuth } from '@/contexts/AuthContext'
import { createOrganization } from '@/services/organizationService'
import { createTeam } from '@/services/teamService'
import { fetchBrandAssets } from '@/services/brandService'
import Image from 'next/image'
import { updateUserProfile } from '@/services/userService'

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

interface BrandInfo {
  name: string;
  domain: string;
  logo?: string;
  icon?: string;
  colors?: string[];
}

export function TeamSetup() {
  const { completeStep } = useOnboarding()
  const { user, refreshUser } = useAuth()
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

  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null)
  const [isFetchingBrand, setIsFetchingBrand] = useState(false)

  // Auto-fetch brand info when domain changes
  useEffect(() => {
    async function getBrandInfo() {
      if (!orgData.domain || COMMON_EMAIL_PROVIDERS.has(orgData.domain.toLowerCase())) {
        setBrandInfo(null)
        return
      }

      try {
        setIsFetchingBrand(true)
        const info = await fetchBrandAssets(orgData.domain)
        const brandInfo: BrandInfo = {
          name: info.companyName || '',
          domain: orgData.domain,
          logo: info.logo,
          icon: info.icon,
          colors: info.colors
        }
        setBrandInfo(brandInfo)
        if (brandInfo.name && !orgData.name) {
          setOrgData(d => ({ ...d, name: brandInfo.name }))
        }
      } catch (error) {
        console.error('Error fetching brand info:', error)
      } finally {
        setIsFetchingBrand(false)
      }
    }

    getBrandInfo()
  }, [orgData.domain])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to create an organization')
      return
    }

    if (!orgData.name || !orgData.domain) {
      setError('Organization name and domain are required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Starting organization creation...') // Debug log

      const organization = await createOrganization({
        name: orgData.name,
        domain: orgData.domain.toLowerCase(),
        ownerId: user.uid,
        branding: brandInfo ? {
          logo: brandInfo.logo,
          icon: brandInfo.icon,
          colors: brandInfo.colors
        } : undefined,
        settings: {
          allowedDomains: [orgData.domain.toLowerCase()],
          weekStartDay: teamData.weekStartDay
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      console.log('Organization created:', organization) // Debug log

      const team = await createTeam({
        name: teamData.name,
        organizationId: organization.id,
        leaderId: user.uid,
        members: [{
          userId: user.uid,
          role: 'admin',
          joinedAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      console.log('Team created:', team) // Debug log
      
      // Update user profile with organization ID
      await updateUserProfile(user.uid, {
        organizationId: organization.id,
        teamId: team.id,
        role: 'admin'
      })

      await refreshUser()
      console.log('User profile updated') // Debug log
      completeStep()
    } catch (err) {
      console.error('Setup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create team. Please try again.')
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
          {brandInfo?.logo && (
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <div className="relative w-48 h-16">
                <Image
                  src={brandInfo.logo}
                  alt={`${orgData.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

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
            <div className="relative">
              <Input
                required
                type="text"
                value={orgData.domain}
                onChange={(e) => setOrgData(d => ({ ...d, domain: e.target.value }))}
                placeholder="acme.com"
              />
              {isFetchingBrand && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent" />
                </div>
              )}
            </div>
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
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Button 
        type="submit"
        disabled={loading || !orgData.name || !orgData.domain}
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Creating...
          </div>
        ) : (
          'Create Organization & Team'
        )}
      </Button>
    </form>
  )
} 