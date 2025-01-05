'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Home, Target, Users, Settings, ChevronDown, Plus, WifiOff, RefreshCw, UserPlus, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore'
import { getTeams, createDefaultTeam, subscribeToTeams } from '@/services/teamService'
import { Team } from '@/types/teams'
import { useToast } from '@/components/ui/use-toast'
import { useTeamVisibility } from '@/contexts/TeamVisibilityContext'
import Image from 'next/image'

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

interface TeamItemProps {
  team: Team;
  isActive: boolean;
  isVisible: boolean;
  onToggleVisibility: (teamId: string) => void;
}

function TeamItem({ team, isActive, isVisible, onToggleVisibility }: TeamItemProps) {
  return (
    <Link href={`/dashboard/teams/${team.id}`} className="block">
      <div className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer">
        <Users className="h-4 w-4 text-gray-500 mr-2" />
        <span className={`text-sm font-medium flex-1 ${
          isActive ? 'text-blue-600' : 'text-gray-600'
        }`}>
          {team.name}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleVisibility(team.id)
          }}
          className="p-1.5 rounded-md hover:bg-gray-100 border border-gray-200"
        >
          {isVisible ? (
            <Eye className="h-3.5 w-3.5 text-blue-500" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>
      </div>
    </Link>
  )
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Goals', href: '/dashboard/goals', icon: Target },
  { name: 'Teams', href: '/dashboard/teams', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function NavigationItem({ item, isActive }: { item: typeof navigation[0], isActive: boolean }) {
  return (
    <Link href={item.href}>
      <Button 
        variant="ghost" 
        className={`w-full justify-start text-sm font-medium ${
          isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <item.icon className="h-4 w-4 mr-3" />
        {item.name}
      </Button>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState('')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const { isTeamVisible, toggleTeamVisibility } = useTeamVisibility()

  // Handle online/offline status
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

  // Load organization data
  const loadOrganization = useCallback(async () => {
    if (!user?.organizationId) return
    
    try {
      const orgRef = doc(db, 'organizations', user.organizationId)
      const orgDoc = await getDoc(orgRef)
      if (!orgDoc.exists()) {
        setError('Organization not found')
        return
      }
      setOrganizationName(orgDoc.data().name)
    } catch (error) {
      console.error('Error loading organization:', error)
      setError('Failed to load organization')
    }
  }, [user?.organizationId])

  // Subscribe to teams
  useEffect(() => {
    if (!user?.organizationId) return

    setIsLoading(true)
    console.log('Setting up teams subscription for organization:', user.organizationId)

    // Ensure organizationId is a string
    const organizationId = user.organizationId

    const unsubscribe = subscribeToTeams(organizationId, async (updatedTeams) => {
      console.log('Received updated teams:', updatedTeams)
      
      // If no teams exist, create a default team
      if (updatedTeams.length === 0 && user.uid) {
        try {
          console.log('Creating default team')
          const defaultTeam = await createDefaultTeam(organizationId, user.uid)
          setTeams([defaultTeam])
        } catch (error) {
          console.error('Error creating default team:', error)
          setError('Failed to create default team')
        }
      } else {
        setTeams(updatedTeams)
      }
      
      setIsLoading(false)
      setError(null)
    })

    return () => {
      console.log('Cleaning up teams subscription')
      unsubscribe()
    }
  }, [user?.organizationId, user?.uid])

  useEffect(() => {
    if (!authLoading && user) {
      console.log('Loading organization for user:', user.uid)
      loadOrganization()
    }
  }, [authLoading, user, loadOrganization])

  const handleRetry = useCallback(() => {
    setError(null)
    loadOrganization()
  }, [loadOrganization])

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
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center">
          <Image 
            src="/logo.svg" 
            alt="OpenAsync" 
            width={62} 
            height={12} 
            className="w-auto h-6"
          />
        </Link>
      </div>
      {/* Workspace Selector */}
      <div className="px-3 py-2 border-b border-gray-200">
        <Button variant="ghost" className="w-full justify-between text-sm font-medium">
          {organizationName || 'Loading...'}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        <Link href="/dashboard/settings?tab=members">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm mt-1 text-gray-500 hover:text-gray-900"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Members
          </Button>
        </Link>
        {isOffline && (
          <div className="flex items-center justify-center gap-2 py-1 px-2 bg-yellow-50 text-yellow-700 text-xs">
            <WifiOff className="h-3 w-3" />
            Offline Mode
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => (
          <NavigationItem 
            key={item.name} 
            item={item} 
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      {/* Teams Section */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">
            TEAMS {teams.length > 0 && `(${teams.length})`}
          </h3>
          <Link href="/dashboard/settings?tab=members">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
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
            <>
              {teams.map(team => (
                <TeamItem 
                  key={team.id} 
                  team={team}
                  isActive={pathname?.includes(team.id)}
                  isVisible={isTeamVisible(team.id)}
                  onToggleVisibility={toggleTeamVisibility}
                />
              ))}
            </>
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