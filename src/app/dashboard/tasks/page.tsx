'use client'

import { useState } from 'react'
import { TasksKanban } from '@/components/tasks/TasksKanban'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { TaskDetailView } from '@/components/goals/TaskDetailView'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { WeekNavigator } from '@/components/dashboard/WeekNavigator'

export default function TasksPage() {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <WeekNavigator />
              <p className="text-sm text-muted-foreground mt-4">
                Track experiments and validate hypotheses in your sprint
              </p>
            </div>
            <Button onClick={() => setIsCreateSheetOpen(true)}>
              New Task
            </Button>
          </div>

          <TasksKanban onAddClick={() => setIsCreateSheetOpen(true)} />
          <TaskSheet 
            isOpen={isCreateSheetOpen} 
            onClose={() => setIsCreateSheetOpen(false)} 
          />
        </div>
      </div>
    </Dashboard>
  )
} 