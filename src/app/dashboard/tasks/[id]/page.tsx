'use client'

import { use } from 'react'
import { TaskDetailView } from '@/components/goals/TaskDetailView'
import { Dashboard } from '@/components/dashboard/Dashboard'

interface TaskPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TaskPage({ params }: TaskPageProps) {
  const { id } = use(params)
  
  return (
    <Dashboard>
      <TaskDetailView goalId={id} />
    </Dashboard>
  )
} 