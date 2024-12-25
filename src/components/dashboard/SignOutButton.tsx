'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
} 