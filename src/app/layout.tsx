'use client'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { WeekProvider } from '@/contexts/WeekContext'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <WeekProvider>
            <OnboardingProvider>
              {children}
              <OnboardingModal />
            </OnboardingProvider>
          </WeekProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
