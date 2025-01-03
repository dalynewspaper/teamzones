import { Suspense } from 'react'
import { getTeams } from '@/services/teamService'
import { TeamManagement } from '@/components/teams/TeamManagement'
import { TeamDetails } from '@/components/teams/TeamDetails'
import { getCurrentUser } from '@/lib/session'

export const metadata = {
  title: 'Teams | OpenAsync',
  description: 'Manage your teams and team members'
}

async function TeamsPageContent() {
  const user = await getCurrentUser()
  if (!user) return null

  const teams = await getTeams(user.organizationId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Teams</h1>
        <p className="text-gray-600 mt-2">
          Create and manage teams to organize your workspace members
        </p>
      </div>

      <TeamManagement
        organizationId={user.organizationId}
        currentUserId={user.id}
      />

      <div className="space-y-6">
        {teams.map(team => (
          <TeamDetails
            key={team.id}
            team={team}
            currentUserId={user.id}
          />
        ))}
      </div>
    </div>
  )
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamsPageContent />
    </Suspense>
  )
} 