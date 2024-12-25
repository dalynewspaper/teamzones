'use client'
import { VideoList } from '@/components/video/VideoList'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '../../hooks/useOrganization'
import { useEffect, useState } from 'react'
import { fetchBrandAssets } from '@/services/brandService'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  const { organization, loading } = useOrganization()
  const [brandAssets, setBrandAssets] = useState<{ logo?: string, colors?: string[] }>({})
  const router = useRouter()

  useEffect(() => {
    // Redirect to onboarding if user has no organization
    if (!loading && user && !('organizationId' in user)) {
      router.push('/onboarding')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (organization?.domain) {
      fetchBrandAssets(organization.domain).then(setBrandAssets)
    }
  }, [organization?.domain])

  // Show loading state while checking organization
  if (loading) {
    return <div>Loading...</div>
  }

  // Don't render dashboard content for users without organization
  if (!organization) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user?.displayName?.split(' ')[0]}!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Record and share updates with your team at {organization?.name}
            </p>
          </div>
          
          {brandAssets.logo && (
            <div className="flex-shrink-0">
              <Image
                src={brandAssets.logo}
                alt={organization?.name || 'Organization logo'}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
          )}
        </div>

        <VideoList />
      </div>
    </div>
  )
} 