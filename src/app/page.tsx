'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()

  if (user) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">TeamZones</h1>
          <Button
            variant="ghost"
            onClick={() => router.push('/signin')}
            className="text-blue-600 hover:text-blue-500"
          >
            Sign In
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Asynchronous team updates made easy
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Record and share weekly updates with your team. Keep everyone in sync without scheduling more meetings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/signup')}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/signin')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t px-4 py-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          © {new Date().getFullYear()} TeamZones. All rights reserved.
        </div>
      </footer>
    </div>
  )
}