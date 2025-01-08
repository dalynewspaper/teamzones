import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getOrganization } from '@/services/organizationService'

interface Organization {
  id: string
  name: string
  domain: string
  members: string[]
  employeeCount: string
  ownerId: string
  settings?: {
    allowedDomains: string[]
    weekStartDay: number
  }
}

export function useOrganization() {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrganization() {
      if (!user?.organizationId) {
        setOrganization(null)
        setLoading(false)
        return
      }

      try {
        const org = await getOrganization(user.organizationId)
        setOrganization(org)
      } catch (error) {
        console.error('Error loading organization:', error)
        setOrganization(null)
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [user?.organizationId])

  return { organization, loading }
} 