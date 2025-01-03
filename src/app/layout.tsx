'use client'

import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { WeekProvider } from '@/contexts/WeekContext'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { ToastProvider } from '@/components/ui/toast'
import { TeamVisibilityProvider } from '@/contexts/TeamVisibilityContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <TeamVisibilityProvider>
            <WeekProvider>
              <OnboardingProvider>
                <ToastProvider>
                  {children}
                  <OnboardingModal />
                </ToastProvider>
              </OnboardingProvider>
            </WeekProvider>
          </TeamVisibilityProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
