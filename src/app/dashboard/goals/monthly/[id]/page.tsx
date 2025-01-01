import { ViewMonthlyGoalPageContent } from '@/components/goals/ViewMonthlyGoalPageContent'
import { Dashboard } from '@/components/dashboard/Dashboard'

interface ViewMonthlyGoalPageProps {
  params: {
    id: string
  }
}

export default function ViewMonthlyGoalPage({ params }: ViewMonthlyGoalPageProps) {
  return (
    <Dashboard>
      <ViewMonthlyGoalPageContent goalId={params.id} />
    </Dashboard>
  )
} 