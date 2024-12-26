'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useAuth } from '@/contexts/AuthContext'
import { fetchBrandInfo } from '@/services/brandService'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export function OrganizationSetup() {
  const { completeStep } = useOnboarding()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [orgData, setOrgData] = useState({
    name: '',
    domain: '',
    employeeCount: ''
  })
  
  // Auto-fill organization data from email
  useEffect(() => {
    if (user?.email) {
      const { name, domain } = extractOrgInfo(user.email)
      setOrgData(prev => ({
        ...prev,
        name: name || '',
        domain: domain || ''
      }))
    }
  }, [user?.email])

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
        const info = await fetchBrandInfo(orgData.domain)
        setBrandInfo(info)
        if (info?.name && !orgData.name) {
          setOrgData(d => ({ ...d, name: info.name }))
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
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Store organization data in context or state management
      // We'll create the organization in the next step along with the team
      completeStep('organization')
    } catch (err) {
      console.error('Setup error:', err)
      setError('Failed to save organization information. Please try again.')
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
            Tell us about your organization
          </p>
        </div>

        <div className="space-y-4">
          {/* Logo Display */}
          {isFetchingBrand ? (
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent" />
            </div>
          ) : brandInfo?.logo ? (
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
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
              value={orgData.domain}
              onChange={(e) => setOrgData(d => ({ ...d, domain: e.target.value }))}
              placeholder="acme.com"
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
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  )
} 