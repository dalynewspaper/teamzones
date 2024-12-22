'use client'
import { ProfileMenu } from './ProfileMenu'

interface HeaderProps {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="fixed right-0 left-64 h-16 bg-white border-b border-gray-200">
      <div className="flex justify-between items-center h-full px-6">
        <div>{children}</div>
        <ProfileMenu />
      </div>
    </header>
  )
} 