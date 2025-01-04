'use client'

import { useState } from 'react'
import { GoalsList } from '@/components/goals/GoalsList'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnnualGoalSheet } from '@/components/goals/AnnualGoalSheet'
import { QuarterlyGoalSheet } from '@/components/goals/QuarterlyGoalSheet'
import { MonthlyGoalSheet } from '@/components/goals/MonthlyGoalSheet'

type GoalTimeframe = 'annual' | 'quarterly' | 'monthly'

export function GoalsPageContent() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<GoalTimeframe>('annual')
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)

  const handleCloseSheet = () => {
    setIsCreateSheetOpen(false)
  }

  const handleCreateClick = () => {
    setIsCreateSheetOpen(true)
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Strategic Goals</h1>
            <p className="text-sm text-muted-foreground">
              Set and track your organization's long-term goals and objectives
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            New {selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)} Goal
          </Button>
        </div>

        <Tabs defaultValue="annual" onValueChange={(value) => setSelectedTimeframe(value as GoalTimeframe)}>
          <TabsList>
            <TabsTrigger value="annual">Annual Goals</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly Goals</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Goals</TabsTrigger>
          </TabsList>
          <TabsContent value="annual">
            <GoalsList timeframe="annual" onCreateClick={handleCreateClick} />
          </TabsContent>
          <TabsContent value="quarterly">
            <GoalsList timeframe="quarterly" onCreateClick={handleCreateClick} />
          </TabsContent>
          <TabsContent value="monthly">
            <GoalsList timeframe="monthly" onCreateClick={handleCreateClick} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal Creation Sheets */}
      {selectedTimeframe === 'annual' && (
        <AnnualGoalSheet 
          isOpen={isCreateSheetOpen} 
          onClose={handleCloseSheet} 
        />
      )}
      {selectedTimeframe === 'quarterly' && (
        <QuarterlyGoalSheet 
          isOpen={isCreateSheetOpen} 
          onClose={handleCloseSheet} 
        />
      )}
      {selectedTimeframe === 'monthly' && (
        <MonthlyGoalSheet 
          isOpen={isCreateSheetOpen} 
          onClose={handleCloseSheet} 
        />
      )}
    </div>
  )
} 