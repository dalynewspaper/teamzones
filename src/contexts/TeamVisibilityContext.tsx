'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface TeamVisibility {
  [teamId: string]: boolean
}

interface TeamVisibilityContextType {
  visibleTeams: TeamVisibility
  toggleTeamVisibility: (teamId: string) => void
  isTeamVisible: (teamId: string) => boolean
}

const TeamVisibilityContext = createContext<TeamVisibilityContextType | undefined>(undefined)

export function TeamVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibleTeams, setVisibleTeams] = useState<TeamVisibility>({})

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('teamVisibility')
    if (saved) {
      try {
        setVisibleTeams(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse team visibility preferences:', e)
      }
    }
  }, [])

  // Save preferences when they change
  useEffect(() => {
    if (Object.keys(visibleTeams).length > 0) {
      localStorage.setItem('teamVisibility', JSON.stringify(visibleTeams))
    }
  }, [visibleTeams])

  const toggleTeamVisibility = (teamId: string) => {
    setVisibleTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }))
  }

  const isTeamVisible = (teamId: string) => {
    return visibleTeams[teamId] ?? true // Default to visible if not set
  }

  return (
    <TeamVisibilityContext.Provider value={{ visibleTeams, toggleTeamVisibility, isTeamVisible }}>
      {children}
    </TeamVisibilityContext.Provider>
  )
}

export function useTeamVisibility() {
  const context = useContext(TeamVisibilityContext)
  if (context === undefined) {
    throw new Error('useTeamVisibility must be used within a TeamVisibilityProvider')
  }
  return context
} 