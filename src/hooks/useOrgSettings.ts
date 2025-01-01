import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getOrganizationSettings } from '@/services/settingsService'

interface OrgSettings {
  name: string
  domain: string
  logo: string
  weekStartDay: string
  dateFormat: string
  allowedDomains: string[]
}

export function useOrgSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      if (!user?.organizationId) {
        setSettings(null)
        setLoading(false)
        return
      }

      try {
        const orgSettings = await getOrganizationSettings(user.organizationId)
        setSettings(orgSettings)
      } catch (err) {
        console.error('Error loading organization settings:', err)
        setError('Failed to load organization settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user?.organizationId])

  return {
    settings,
    loading,
    error,
    dateFormat: settings?.dateFormat || 'MM/dd/yyyy'
  }
} 