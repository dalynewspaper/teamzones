import { Sidebar } from '@/components/layout/Sidebar'
import { ProfileMenu } from '@/components/layout/ProfileMenu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <header className="bg-white border-b px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">TeamZones</h1>
            <ProfileMenu />
          </div>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  )
} 