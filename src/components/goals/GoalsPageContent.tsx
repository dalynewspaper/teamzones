'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles } from 'lucide-react'
import { GoalTimeframe } from '@/types/goals'
import { GoalsList } from './GoalsList'
import { CreateGoalDialog } from './CreateGoalDialog'

export function GoalsPageContent() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<GoalTimeframe>('annual')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value as GoalTimeframe)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategic Goals</h1>
          <p className="text-muted-foreground mt-2">
            Set and track your organization's long-term goals and objectives
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Sparkles className="h-4 w-4" />
          New {selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)} Goal
        </Button>
      </div>

      <Tabs value={selectedTimeframe} onValueChange={handleTimeframeChange} className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="annual">Annual Goals</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly Goals</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Goals</TabsTrigger>
        </TabsList>
      </Tabs>

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onGoalCreated={(goalId) => {
          setIsCreateDialogOpen(false)
        }}
        timeframe={selectedTimeframe}
        selectedWeek={new Date()}
      />

      <GoalsList 
        timeframe={selectedTimeframe} 
        onCreateClick={() => setIsCreateDialogOpen(true)} 
      />
    </div>
  )
} 