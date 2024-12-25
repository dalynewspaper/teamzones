'use client';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleButton } from '@/components/auth/GoogleButton'
import Image from 'next/image'
import Link from 'next/link'

export default function SignInPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { authenticateWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await authenticateWithGoogle()
      router.push('/dashboard')
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
              Welcome back
            </h1>
            <p className="mt-3 text-lg text-gray-500">
              Record and share updates that move work forward
            </p>
          </div>

          {/* Sign In Card */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <GoogleButton 
              onClick={handleGoogleSignIn}
              loading={isLoading}
              className="w-full py-6 text-lg"
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link 
                  href="/signup" 
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Quick Updates</h3>
              <p className="mt-2 text-sm text-gray-500">Record and share video updates in seconds</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Team Sync</h3>
              <p className="mt-2 text-sm text-gray-500">Keep your team aligned and informed</p>
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