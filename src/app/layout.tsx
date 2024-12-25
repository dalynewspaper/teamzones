import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { WeekProvider } from '@/contexts/WeekContext'
import { OnboardingProvider } from '@/contexts/OnboardingContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TeamZones',
  description: 'Record and share weekly updates with your team'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AuthProvider>
          <OnboardingProvider>
            <WeekProvider>
              {children}
            </WeekProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
