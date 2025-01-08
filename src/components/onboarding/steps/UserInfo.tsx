'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useAuth } from '@/contexts/AuthContext'
import { createUserProfile, updateUserProfile } from '@/services/userService'

export function UserInfo() {
  const { completeStep } = useOnboarding()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [userData, setUserData] = useState({
    name: user?.displayName || '',
    title: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading) return

    try {
      setLoading(true)
      setError(null)

      // Create user profile
      await createUserProfile(user.uid, {
        email: user.email || '',
        displayName: userData.name,
        title: userData.title,
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        onboardingCompleted: false
      })

      // Move to next step
      completeStep('user-info')
    } catch (err) {
      console.error('Setup error:', err)
      setError('Failed to save user information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative bg-white">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Your Information</h3>
          <p className="text-sm text-gray-500">
            Tell us about yourself
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <Input
              required
              value={userData.name}
              onChange={(e) => setUserData(d => ({ ...d, name: e.target.value }))}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Job Title</label>
            <Input
              required
              value={userData.title}
              onChange={(e) => setUserData(d => ({ ...d, title: e.target.value }))}
              placeholder="Software Engineer"
              disabled={loading}
            />
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