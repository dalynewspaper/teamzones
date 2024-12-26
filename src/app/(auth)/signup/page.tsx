'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { createUserProfile } from '@/services/userService'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SignUpPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { authenticateWithGoogle } = useAuth()
  const { refreshOnboarding } = useOnboarding()

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const user = await authenticateWithGoogle()
      if (user) {
        // Create the user profile with minimal info and onboarding not completed
        await createUserProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || '',
          ...(user.photoURL ? { photoURL: user.photoURL } : {}),
          onboardingCompleted: false
        })
        
        // Navigate to dashboard with onboarding flag
        router.replace('/dashboard?onboarding=true')
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="w-full p-6 border-b bg-white/80 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-block">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Open Async
            </motion.h1>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-gray-600">
              Join Open Async to start collaborating with your team
            </p>
          </div>

          <div className="space-y-4">
            <GoogleButton 
              onClick={handleGoogleSignUp}
              loading={isLoading}
            />

            {error && (
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-500 text-center">
              Already have an account?{' '}
              <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 