'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useAuth } from '@/contexts/AuthContext'
import { fetchBrandInfo } from '@/services/brandService'
import { isLogoLight } from '@/utils/imageAnalysis'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { doc, updateDoc, getDoc, getDocs, query, where, arrayUnion, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { createOrganization } from '@/services/organizationService'
import { createTeam } from '@/services/teamService'
import { Team as FirestoreTeam } from '@/types/firestore'
import { TeamRole, TeamVisibility } from '@/types/teams'

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

const EMPLOYEE_COUNT_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1001+ employees' }
];

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

interface Organization {
  id: string;
  name: string;
  domain: string;
  members: string[];
  employeeCount: string;
  ownerId: string;
  settings: {
    allowedDomains: string[];
    weekStartDay: number;
  };
}

interface TeamMember {
  userId: string;
  role: string;
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  ownerId: string;
  visibility: string;
  isDefault: boolean;
  members: TeamMember[];
}

export function OrganizationSetup() {
  const { completeStep } = useOnboarding()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLightLogo, setIsLightLogo] = useState(false)
  
  const [orgData, setOrgData] = useState({
    name: '',
    domain: '',
    employeeCount: ''
  })
  
  // Auto-fill organization data from email and existing organization
  useEffect(() => {
    async function initializeOrgData() {
      if (!user?.email) return

      try {
        // Check if user already has an organization
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.exists() ? userSnap.data() : null
        
        if (userData?.organizationId) {
          const orgRef = doc(db, 'organizations', userData.organizationId)
          const orgSnap = await getDoc(orgRef)
          const orgData = orgSnap.exists() ? orgSnap.data() : null
          
          if (orgData) {
            setOrgData(prev => ({
              ...prev,
              name: orgData.name || prev.name,
              domain: orgData.domain || prev.domain,
              employeeCount: orgData.employeeCount || prev.employeeCount
            }))
            return
          }
        }

        // If no existing org, try to extract from email
        const { name, domain } = extractOrgInfo(user.email)
        setOrgData(prev => ({
          ...prev,
          name: name || prev.name,
          domain: domain || prev.domain
        }))
      } catch (error) {
        console.error('Error initializing org data:', error)
      }
    }

    initializeOrgData()
  }, [user?.email])

  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null)
  const [isFetchingBrand, setIsFetchingBrand] = useState(false)

  // Auto-fetch brand info when domain changes
  useEffect(() => {
    let isSubscribed = true
    async function getBrandInfo() {
      if (!orgData.domain || COMMON_EMAIL_PROVIDERS.has(orgData.domain.toLowerCase())) {
        setBrandInfo(null)
        return
      }

      try {
        setIsFetchingBrand(true)
        const info = await fetchBrandInfo(orgData.domain)
        if (isSubscribed) {
          setBrandInfo(info)
          if (info?.name && !orgData.name) {
            setOrgData(d => ({ ...d, name: info.name }))
          }
        }
      } catch (error) {
        console.error('Error fetching brand info:', error)
        if (isSubscribed) {
          setBrandInfo(null)
        }
      } finally {
        if (isSubscribed) {
          setIsFetchingBrand(false)
        }
      }
    }

    getBrandInfo()
    return () => {
      isSubscribed = false
    }
  }, [orgData.domain])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading) return
    if (!orgData.name || !orgData.domain || !orgData.employeeCount) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create new organization
      const organization = await createOrganization({
        name: orgData.name.trim(),
        domain: orgData.domain.toLowerCase().trim(),
        employeeCount: orgData.employeeCount,
        ownerId: user.uid,
        members: [user.uid],
        settings: {
          allowedDomains: [orgData.domain.toLowerCase().trim()],
          weekStartDay: 1
        }
      })

      // Create default team
      const now = new Date().toISOString()
      const team = await createTeam({
        name: 'General',
        description: 'Default team for all members',
        organizationId: organization.id,
        ownerId: user.uid,
        visibility: 'public' as TeamVisibility,
        isDefault: true,
        members: [{
          userId: user.uid,
          role: 'admin' as TeamRole,
          joinedAt: now
        }]
      })

      // Update user profile with organization and team info
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        organizationId: organization.id,
        teams: [team.id],
        defaultTeam: team.id,
        updatedAt: now
      })

      // Complete the onboarding step
      completeStep('organization')
    } catch (err) {
      console.error('Setup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save organization information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative bg-white">
      <div className="space-y-4">
        {/* Logo Display */}
        {isFetchingBrand ? (
          <div className="flex justify-center p-8 bg-gray-700 rounded-lg">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent" />
          </div>
        ) : brandInfo?.logo ? (
          <div className="bg-gray-700 p-8 flex items-center justify-center rounded-lg">
            <div className="relative w-48 h-16">
              <Image
                src={brandInfo.logo}
                alt={`${orgData.name} logo`}
                fill
                className="object-contain"
                unoptimized // Since we're using external URLs
              />
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="text-lg font-medium">Organization Setup</h3>
          <p className="text-sm text-gray-500">
            Tell us about your organization
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
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Will be displayed as "{orgData.name || 'Your'}'s Workspace"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Company Domain</label>
            <Input
              required
              type="text"
              value={orgData.domain}
              onChange={(e) => setOrgData(d => ({ ...d, domain: e.target.value }))}
              placeholder="acme.com"
              pattern="^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be used to verify team members
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Company Size</label>
            <Select 
              value={orgData.employeeCount}
              onValueChange={(value) => setOrgData(d => ({ ...d, employeeCount: value }))}
              disabled={loading}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg">
                {EMPLOYEE_COUNT_OPTIONS.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-gray-100"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 px-6">
          {error}
        </div>
      )}

      <div className="px-6 pb-6">
        <Button 
          type="submit" 
          className="w-full relative z-10" 
          variant="default"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  )
} 