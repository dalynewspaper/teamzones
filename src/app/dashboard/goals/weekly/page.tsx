'use client'

import { useState } from 'react'
import { WeeklyGoalsKanban } from '@/components/dashboard/WeeklyGoalsKanban'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { WeeklyGoalSheet } from '@/components/goals/WeeklyGoalSheet'

export default function WeeklyGoalsPage() {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Weekly Goals</h1>
              <p className="text-sm text-muted-foreground">
                Manage and track your weekly goals in a Kanban board
              </p>
            </div>
            <Button onClick={() => setIsCreateSheetOpen(true)}>
              New Weekly Goal
            </Button>
          </div>

          <WeeklyGoalsKanban onAddClick={() => setIsCreateSheetOpen(true)} />
          <WeeklyGoalSheet 
            isOpen={isCreateSheetOpen} 
            onClose={() => setIsCreateSheetOpen(false)} 
          />
        </div>
      </div>
    </Dashboard>
  )
} 