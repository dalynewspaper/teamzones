import { EditMonthlyGoalPageContent } from '@/components/goals/EditMonthlyGoalPageContent'
import { Dashboard } from '@/components/dashboard/Dashboard'

interface EditMonthlyGoalPageProps {
  params: {
    id: string
  }
}

export default function EditMonthlyGoalPage({ params }: EditMonthlyGoalPageProps) {
  return (
    <Dashboard>
      <EditMonthlyGoalPageContent goalId={params.id} />
    </Dashboard>
  )
} 