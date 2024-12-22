'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()
  const { logout } = useAuth()

  const handleSignOut = async () => {
    try {
      await logout()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
    >
      Sign Out
    </button>
  )
} 