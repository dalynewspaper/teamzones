import { ViewWeeklyGoalPageContent } from '@/components/goals/ViewWeeklyGoalPageContent'
import { Dashboard } from '@/components/dashboard/Dashboard'

interface ViewWeeklyGoalPageProps {
  params: {
    id: string
  }
}

export default function ViewWeeklyGoalPage({ params }: ViewWeeklyGoalPageProps) {
  return (
    <Dashboard>
      <ViewWeeklyGoalPageContent goalId={params.id} />
    </Dashboard>
  )
} 