'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoalsList } from '@/components/goals/GoalsList'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type GoalTimeframe = 'annual' | 'quarterly' | 'monthly'

export function GoalsPageContent() {
  const router = useRouter()
  const [selectedTimeframe, setSelectedTimeframe] = useState<GoalTimeframe>('annual')

  const handleNewGoal = () => {
    router.push(`/dashboard/goals/new/${selectedTimeframe}`)
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
          <Button onClick={handleNewGoal}>
            New {selectedTimeframe} Goal
          </Button>
        </div>

        <Tabs defaultValue="annual" onValueChange={(value) => setSelectedTimeframe(value as GoalTimeframe)}>
          <TabsList>
            <TabsTrigger value="annual">Annual Goals</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly Goals</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Goals</TabsTrigger>
          </TabsList>
          <TabsContent value="annual">
            <GoalsList timeframe="annual" />
          </TabsContent>
          <TabsContent value="quarterly">
            <GoalsList timeframe="quarterly" />
          </TabsContent>
          <TabsContent value="monthly">
            <GoalsList timeframe="monthly" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 