'use client'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">TeamZones</h1>
          <Link href={user ? '/dashboard' : '/signin'}>
            <Button>{user ? 'Go to Dashboard' : 'Sign In'}</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Asynchronous team updates made easy
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Record and share weekly updates with your team. Keep everyone in sync without scheduling more meetings.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href={user ? '/dashboard' : '/signin'}>
                <Button size="lg">
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} TeamZones. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}