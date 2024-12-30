import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Home, Video, Target, BarChart3, Activity, Settings, ChevronDown, Plus, Users, WifiOff, RefreshCw, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore'
import { getUserTeams } from '@/services/teamService'
import { Team } from '@/types/firestore'
import { useToast } from '@/components/ui/use-toast'

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence')
    }
  });
} catch (err) {
  console.warn('Error enabling persistence:', err)
}

function TeamItem({ team }: { team: Team }) {
  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        className="w-full justify-start text-sm font-medium h-9 px-2"
      >
        <Users className="h-4 w-4 mr-2" />
        {team.name}
      </Button>
    </div>
  )
}

export function Sidebar() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [organizationName, setOrganizationName] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOrganization = useCallback(async () => {
    if (!user?.organizationId) return

    try {
      setIsLoading(true)
      const orgRef = doc(db, 'organizations', user.organizationId)
      const orgSnap = await getDoc(orgRef)
      if (orgSnap.exists()) {
        setOrganizationName(orgSnap.data().name)
      }
      setError(null)
    } catch (error) {
      console.error('Error loading organization:', error)
      setError('Failed to load organization')
    } finally {
      setIsLoading(false)
    }
  }, [user?.organizationId])

  const loadTeams = useCallback(async () => {
    if (!user?.uid || !user?.organizationId) return

    try {
      setIsLoading(true)
      const userTeams = await getUserTeams(user.uid, user.organizationId)
      setTeams(userTeams)
      setError(null)
    } catch (error) {
      console.error('Error loading teams:', error)
      setError('Failed to load teams')
    } finally {
      setIsLoading(false)
    }
  }, [user?.uid, user?.organizationId])

  useEffect(() => {
    if (!authLoading && user) {
      loadOrganization()
      loadTeams()
    }
  }, [authLoading, user, loadOrganization, loadTeams])

  const handleRetry = useCallback(() => {
    setError(null)
    loadOrganization()
    loadTeams()
  }, [loadOrganization, loadTeams])

  if (authLoading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Workspace Selector */}
      <div className="px-3 py-2 border-b border-gray-200">
        <Button variant="ghost" className="w-full justify-between text-sm font-medium">
          {organizationName ? `${organizationName}'s Workspace` : 'Loading...'}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm mt-1 text-gray-500 hover:text-gray-900"
          onClick={() => router.push('/dashboard/settings?tab=members')}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Team Members
        </Button>
        {isOffline && (
          <div className="flex items-center justify-center gap-2 py-1 px-2 bg-yellow-50 text-yellow-700 text-xs">
            <WifiOff className="h-3 w-3" />
            Offline Mode
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <Link href="/dashboard">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : ''}`}
          >
            <Home className="h-4 w-4 mr-3" />
            Home
          </Button>
        </Link>
        <Link href="/dashboard/goals">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${pathname === '/dashboard/goals' ? 'bg-blue-50 text-blue-700' : ''}`}
          >
            <Target className="h-4 w-4 mr-3" />
            Goals
          </Button>
        </Link>
        <Link href="/dashboard/updates">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${pathname === '/dashboard/updates' ? 'bg-blue-50 text-blue-700' : ''}`}
          >
            <Video className="h-4 w-4 mr-3" />
            My Updates
          </Button>
        </Link>
        <Link href="/dashboard/insights">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${pathname === '/dashboard/insights' ? 'bg-blue-50 text-blue-700' : ''}`}
          >
            <BarChart3 className="h-4 w-4 mr-3" />
            Insights
          </Button>
        </Link>
        <Link href="/dashboard/activity">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${pathname === '/dashboard/activity' ? 'bg-blue-50 text-blue-700' : ''}`}
          >
            <Activity className="h-4 w-4 mr-3" />
            Activity
          </Button>
        </Link>
        <Link href="/dashboard/settings">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${pathname === '/dashboard/settings' ? 'bg-blue-50 text-blue-700' : ''}`}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
        </Link>
      </nav>

      {/* Teams Section */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">TEAMS</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center gap-2"
                onClick={handleRetry}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          ) : teams.length > 0 ? (
            teams.map(team => (
              <TeamItem 
                key={team.id} 
                team={team}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {isLoading ? 'Loading teams...' : 'No teams available'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 