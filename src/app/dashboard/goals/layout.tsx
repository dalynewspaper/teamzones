'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Annual Goals', href: '/dashboard/goals?timeframe=annual' },
  { name: 'Quarterly Goals', href: '/dashboard/goals?timeframe=quarterly' },
  { name: 'Monthly Goals', href: '/dashboard/goals?timeframe=monthly' }
]

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 overflow-auto bg-background">
      {children}
    </div>
  )
} 