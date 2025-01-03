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
  const pathname = usePathname()

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="border-b">
        <nav className="flex gap-6 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                border-b-2 px-1 pb-4 pt-4 text-sm font-medium
                ${pathname === tab.href
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }
              `}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
} 