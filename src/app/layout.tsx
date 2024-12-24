import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { WeekProvider } from '@/contexts/WeekContext'

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
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <WeekProvider>
            {children}
          </WeekProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
