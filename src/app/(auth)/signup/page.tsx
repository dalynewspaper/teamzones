'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { MicrosoftButton } from '@/components/auth/MicrosoftButton'
import { createUserProfile } from '@/services/userService'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/logo'

export default function SignUpPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState<'google' | 'microsoft' | null>(null)
  const router = useRouter()
  const { authenticateWithGoogle, authenticateWithMicrosoft } = useAuth()
  const { refreshOnboarding } = useOnboarding()

  const handleGoogleSignUp = async () => {
    setIsLoading('google')
    try {
      const user = await authenticateWithGoogle()
      if (user) {
        await createUserProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || '',
          ...(user.photoURL ? { photoURL: user.photoURL } : {}),
          onboardingCompleted: false
        })
        router.replace('/dashboard?onboarding=true')
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  const handleMicrosoftSignUp = async () => {
    setIsLoading('microsoft')
    try {
      const user = await authenticateWithMicrosoft()
      if (user) {
        await createUserProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || '',
          ...(user.photoURL ? { photoURL: user.photoURL } : {}),
          onboardingCompleted: false
        })
        router.replace('/dashboard?onboarding=true')
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />
      </div>

      {/* Header */}
      <header className="w-full p-6 border-b bg-white/80 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white/80 backdrop-blur-md shadow-xl shadow-blue-500/5 rounded-2xl p-8 border border-gray-200"
          >
            {/* Decorative Elements */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24">
              <div className="absolute inset-0 bg-gradient-to-r from-[#4263EB] to-blue-600 rounded-full blur-2xl opacity-20" />
              <div className="relative w-24 h-24 bg-white rounded-full border border-gray-200 shadow-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-[#4263EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="text-center mt-8 mb-8">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold tracking-tight text-gray-900"
              >
                Create your account
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-gray-600"
              >
                Join OpenAsync to start collaborating with your team
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <GoogleButton 
                onClick={handleGoogleSignUp}
                loading={isLoading === 'google'}
              />

              <MicrosoftButton 
                onClick={handleMicrosoftSignUp}
                loading={isLoading === 'microsoft'}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-400 bg-gray-50 cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Email sign up coming soon</span>
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Already have an account?{' '}
                <Link 
                  href="/signin" 
                  className="font-medium text-[#4263EB] hover:text-blue-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
} 