import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Team } from '@/types/firestore'
import { getUserTeams } from '@/services/teamService'
import { useAuth } from '@/contexts/AuthContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TeamSelectorProps {
  onTeamSelect: (teamId: string) => void
  selectedTeamId?: string
}

export function TeamSelector({ onTeamSelect, selectedTeamId }: TeamSelectorProps) {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTeams() {
      if (!user?.uid || !user?.organizationId) return

      try {
        const userTeams = await getUserTeams(user.uid, user.organizationId)
        setTeams(userTeams)
        
        // If no team is selected and we have teams, select the first one (General)
        if (!selectedTeamId && userTeams.length > 0) {
          onTeamSelect(userTeams[0].id)
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeams()
  }, [user?.uid, user?.organizationId, selectedTeamId, onTeamSelect])

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <Users className="w-4 h-4 text-gray-400" />
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <Select
      value={selectedTeamId}
      onValueChange={onTeamSelect}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a team" />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{team.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 