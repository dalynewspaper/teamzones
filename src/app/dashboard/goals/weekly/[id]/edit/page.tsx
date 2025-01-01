import { EditWeeklyGoalPageContent } from '@/components/goals/EditWeeklyGoalPageContent'
import { Dashboard } from '@/components/dashboard/Dashboard'

interface EditWeeklyGoalPageProps {
  params: {
    id: string
  }
}

export default function EditWeeklyGoalPage({ params }: EditWeeklyGoalPageProps) {
  return (
    <Dashboard>
      <EditWeeklyGoalPageContent goalId={params.id} />
    </Dashboard>
  )
} 