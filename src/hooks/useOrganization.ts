'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Organization } from '@/types/firestore'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useOrganization() {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchOrganization() {
      if (!user?.organizationId) {
        setLoading(false)
        return
      }

      try {
        const orgDoc = await getDoc(doc(db, 'organizations', user.organizationId))
        if (orgDoc.exists()) {
          setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch organization'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [user?.organizationId])

  return { organization, loading, error }
} 