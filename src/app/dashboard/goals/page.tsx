'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useWeek } from '@/contexts/WeekContext'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { GoalsList } from '@/components/goals/GoalsList'
import { Goal, GoalTimeframe } from '@/types/goals'
import { getGoalsByTimeframe } from '@/services/goalService'
import { useAuth } from '@/contexts/AuthContext'

const timeframeLabels: Record<GoalTimeframe, string> = {
  annual: 'Annual Goals',
  quarterly: 'Quarterly Goals',
  monthly: 'Monthly Goals',
  weekly: 'Weekly Goals'
}

export default function GoalsPage() {
  const { currentWeek } = useWeek()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<GoalTimeframe>('annual')
  const [goals, setGoals] = useState<Goal[]>([])

  // Calculate current quarter
  const now = new Date()
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1 as 1 | 2 | 3 | 4
  const currentYear = now.getFullYear()

  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.organizationId) return
      
      try {
        setIsLoading(true)
        const fetchedGoals = await getGoalsByTimeframe(selectedTimeframe, user.organizationId)
        setGoals(fetchedGoals)
      } catch (error) {
        console.error('Error loading goals:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGoals()
  }, [selectedTimeframe, user?.organizationId])

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{timeframeLabels[selectedTimeframe]}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and manage your {selectedTimeframe} goals
                {selectedTimeframe === 'weekly' && currentWeek?.startDate && 
                  ` for week of ${currentWeek.startDate.toLocaleDateString()}`
                }
              </p>
            </div>
            {selectedTimeframe === 'annual' ? (
              <Link href="/dashboard/goals/new">
                <Button className="bg-[#4263EB] hover:bg-[#3b5bdb] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Annual Goal
                </Button>
              </Link>
            ) : selectedTimeframe === 'quarterly' && (
              <Link href={`/dashboard/goals/new/quarterly?quarter=${currentQuarter}&year=${currentYear}`}>
                <Button className="bg-[#4263EB] hover:bg-[#3b5bdb] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Quarterly Goal
                </Button>
              </Link>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="flex space-x-2">
            {(['annual', 'quarterly', 'monthly', 'weekly'] as GoalTimeframe[]).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={selectedTimeframe === timeframe ? 'bg-[#4263EB]' : ''}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </Button>
            ))}
          </div>

          {/* Goals List */}
          <GoalsList
            goals={goals}
            timeframe={selectedTimeframe}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Dashboard>
  )
} 