'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoalsList } from '@/components/goals/GoalsList'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { GoalTimeframe } from '@/types/goals'

export default function GoalsPage() {
  const router = useRouter()
  const [selectedTimeframe, setSelectedTimeframe] = useState<GoalTimeframe>('annual')

  const handleNewGoal = () => {
    router.push(`/dashboard/goals/new/${selectedTimeframe}`)
  }

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
              <p className="text-sm text-muted-foreground">
                Set and track your organization's goals and objectives
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
            </TabsList>
            <TabsContent value="annual">
              <GoalsList timeframe="annual" />
            </TabsContent>
            <TabsContent value="quarterly">
              <GoalsList timeframe="quarterly" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Dashboard>
  )
} 