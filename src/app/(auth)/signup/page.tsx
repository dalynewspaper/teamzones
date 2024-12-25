'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { createUserProfile } from '@/services/userService'
import Image from 'next/image'
import Link from 'next/link'

export default function SignUpPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { authenticateWithGoogle } = useAuth()

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const user = await authenticateWithGoogle()
      if (user) {
        await createUserProfile(user)
        router.push('/dashboard?newUser=true')
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="w-full p-6">
        <div className="max-w-7xl mx-auto">
          <Image 
            src="/logo.svg" 
            alt="TeamZones" 
            width={140} 
            height={32}
            className="w-auto h-8"
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Hero Text */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Create your account
            </h1>
            <p className="mt-3 text-lg text-gray-500">
              Join TeamZones to start sharing video updates with your team
            </p>
          </div>

          {/* Sign Up Card */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <GoogleButton 
              onClick={handleGoogleSignUp}
              loading={isLoading}
              className="w-full py-6 text-lg"
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link 
                  href="/signin" 
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Secure Access</h3>
              <p className="mt-2 text-sm text-gray-500">Your data is protected and private</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Instant Setup</h3>
              <p className="mt-2 text-sm text-gray-500">Get started in seconds</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} TeamZones. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 