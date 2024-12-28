'use client';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { MicrosoftButton } from '@/components/auth/MicrosoftButton'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/logo'

export default function SignInPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState<'google' | 'microsoft' | null>(null)
  const router = useRouter()
  const { authenticateWithGoogle, authenticateWithMicrosoft } = useAuth()

  const handleGoogleSignIn = async () => {
    setIsLoading('google')
    try {
      await authenticateWithGoogle()
      router.push('/dashboard')
    } catch (err) {
      console.error('Authentication error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setIsLoading('microsoft')
    try {
      await authenticateWithMicrosoft()
      router.push('/dashboard')
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

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-md w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Hero Text */}
            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold tracking-tight text-gray-900"
              >
                Sign in to your account
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-gray-600"
              >
                Welcome back! Please sign in to continue
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <GoogleButton 
                onClick={handleGoogleSignIn}
                loading={isLoading === 'google'}
              />

              <MicrosoftButton 
                onClick={handleMicrosoftSignIn}
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
                Don't have an account?{' '}
                <Link 
                  href="/signup" 
                  className="font-medium text-[#4263EB] hover:text-blue-500 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
} 