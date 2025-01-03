'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Video, Target } from 'lucide-react'
import { WeeklyGoalsKanban } from './WeeklyGoalsKanban'
import { UpdatesGrid } from './UpdatesGrid'

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState('updates')

  return (
    <div className="max-w-7xl w-full mx-auto py-6 px-6">
      <Tabs defaultValue="updates" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Weekly Goals
            </TabsTrigger>
          </TabsList>
          
          {/* Conditional action button based on active tab */}
          {activeTab === 'updates' ? (
            <Button className="bg-[#4263EB] hover:bg-[#3b5bdb] text-white">
              <Video className="mr-2 h-4 w-4" /> Record Update
            </Button>
          ) : (
            <Button className="bg-[#4263EB] hover:bg-[#3b5bdb] text-white">
              <Target className="mr-2 h-4 w-4" /> Add Goal
            </Button>
          )}
        </div>

        <TabsContent value="updates" className="m-0">
          <UpdatesGrid />
        </TabsContent>

        <TabsContent value="goals" className="m-0">
          <WeeklyGoalsKanban />
        </TabsContent>
      </Tabs>
    </div>
  )
} 