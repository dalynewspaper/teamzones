'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Target, ArrowRight, TrendingUp, Sparkles, ChevronRight, Pencil, MoreHorizontal } from 'lucide-react'
import { Goal, GoalTimeframe, GoalMetric, GoalKeyResult, GoalAssignee } from '@/types/goals'
import { useGoals } from '@/hooks/useGoals'
import { format, differenceInDays, isValid, parseISO } from 'date-fns'

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
}

interface SparklineChartProps {
  data: number[]
  width?: number
  height?: number
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value = 0, 
  size = 64, 
  strokeWidth = 4 
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progressValue = Math.min(100, Math.max(0, value)) // Clamp value between 0 and 100
  const offset = Number.isFinite(progressValue) ? circumference - (progressValue / 100) * circumference : circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
        {progressValue}%
      </div>
    </div>
  )
}

const SparklineChart: React.FC<SparklineChartProps> = ({ 
  data, 
  width = 80, 
  height = 24 
}) => {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min
  const points = data.map((value: number, index: number) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="text-primary/50">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="drop-shadow-sm"
      />
    </svg>
  )
}

export function GoalsPageContent() {
  const router = useRouter()
  const [selectedTimeframe, setSelectedTimeframe] = useState<GoalTimeframe>('annual')
  const { goals, loading } = useGoals(selectedTimeframe)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  // Filter goals by timeframe
  const filteredGoals = goals?.filter(goal => goal.timeframe === selectedTimeframe) || []

  // Calculate completion percentage
  const calculateCompletion = (goal: Goal): number => {
    if (!goal.metrics || goal.metrics.length === 0) return 0
    const completionSum = goal.metrics.reduce((sum, metric) => {
      if (!metric.target || metric.target === 0) return sum
      const progress = (metric.current || 0) / metric.target * 100
      return sum + (Number.isFinite(progress) ? progress : 0)
    }, 0)
    return Math.round(completionSum / goal.metrics.length)
  }

  // Get goal health status
  const getGoalHealth = (goal: Goal): 'on-track' | 'at-risk' | 'behind' => {
    const completion = calculateCompletion(goal)
    try {
      const startDate = new Date(goal.startDate)
      const endDate = new Date(goal.endDate)
      const now = new Date()
      
      if (!isValidDate(startDate) || !isValidDate(endDate)) return 'behind'
      
      const daysPassed = differenceInDays(now, startDate)
      const totalDays = differenceInDays(endDate, startDate)
      
      if (totalDays <= 0) return 'behind'
      
      const expectedProgress = (daysPassed / totalDays) * 100

      if (completion >= expectedProgress - 10) return 'on-track'
      if (completion >= expectedProgress - 20) return 'at-risk'
      return 'behind'
    } catch (error) {
      console.error('Error calculating goal health:', error)
      return 'behind'
    }
  }

  // Get time remaining indicator
  const getTimeIndicator = (goal: Goal) => {
    try {
      const startDate = new Date(goal.startDate)
      const endDate = new Date(goal.endDate)
      const now = new Date()
      
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return {
          daysRemaining: 0,
          timeProgress: 0,
          isUrgent: false
        }
      }
      
      const daysRemaining = differenceInDays(endDate, now)
      const totalDays = differenceInDays(endDate, startDate)
      
      if (totalDays <= 0) {
        return {
          daysRemaining: 0,
          timeProgress: 100,
          isUrgent: true
        }
      }
      
      const timeProgress = 100 - (daysRemaining / totalDays) * 100

      return {
        daysRemaining: Math.max(0, daysRemaining),
        timeProgress: Math.min(100, Math.max(0, timeProgress)),
        isUrgent: daysRemaining <= 14 && calculateCompletion(goal) < 80
      }
    } catch (error) {
      console.error('Error calculating time indicator:', error)
      return {
        daysRemaining: 0,
        timeProgress: 0,
        isUrgent: false
      }
    }
  }

  // Helper function to validate and format dates
  const formatSafeDate = (date: Date | string | undefined): string => {
    if (!date) return 'No due date'
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      if (!isValid(dateObj)) return 'No due date'
      return format(dateObj, 'MMM d, yyyy')
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'No due date'
    }
  }

  // Helper function to get default end date
  const getDefaultEndDate = (): Date => {
    const now = new Date()
    return new Date(now.getFullYear(), 11, 31) // December 31st of current year
  }

  // Helper function to validate dates
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime())
  }

  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value as GoalTimeframe)
  }

  const handleEditGoal = (e: React.MouseEvent, goalId: string) => {
    e.stopPropagation() // Prevent card expansion when clicking edit
    router.push(`/dashboard/goals/${selectedTimeframe}/${goalId}/edit`)
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
        <Button onClick={() => router.push('/dashboard/goals/new')} className="gap-2">
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

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {filteredGoals.map((goal: Goal) => {
              const completion = calculateCompletion(goal)
              const health = getGoalHealth(goal)
              const isExpanded = expandedGoal === goal.id

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={`p-6 transition-all duration-200 hover:shadow-md ${
                      isExpanded ? 'ring-2 ring-primary/10' : ''
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header with Visual Indicators */}
                      <div className="flex items-start justify-between gap-8">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{goal.title}</h2>
                            <Badge variant={goal.type === 'company' ? 'default' : 'secondary'}>
                              {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
                            </Badge>
                            <Badge 
                              variant={
                                health === 'on-track' ? 'success' : 
                                health === 'at-risk' ? 'warning' : 'destructive'
                              }
                              className="capitalize"
                            >
                              {health.replace('-', ' ')}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleEditGoal(e, goal.id)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-muted-foreground pr-8">{goal.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <CircularProgress value={completion} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                          >
                            <ChevronRight 
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`} 
                            />
                          </Button>
                        </div>
                      </div>

                      {/* Team Members */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex -space-x-2">
                          {goal.assignees?.slice(0, 4).map((assignee: GoalAssignee) => (
                            <TooltipProvider key={assignee.userId}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Avatar className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={assignee.photoURL} />
                                    <AvatarFallback>{assignee.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{assignee.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{assignee.role}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {goal.assignees && goal.assignees.length > 4 && (
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarFallback>+{goal.assignees.length - 4}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pt-4 mt-4 border-t space-y-6"
                        >
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-3 gap-4">
                            {goal.metrics?.map((metric: GoalMetric, index: number) => {
                              const progress = (metric.current / metric.target) * 100
                              return (
                                <Card key={index} className="p-4 bg-muted/50">
                                  <h4 className="font-medium text-sm mb-2">{metric.name}</h4>
                                  <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                      <p className="text-2xl font-bold tabular-nums">
                                        {metric.current}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">
                                          {metric.unit}
                                        </span>
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Target: {metric.target}{metric.unit}
                                      </p>
                                    </div>
                                    <CircularProgress value={progress} size={48} strokeWidth={3} />
                                  </div>
                                </Card>
                              )
                            })}
                          </div>

                          {/* Key Results */}
                          {goal.keyResults && goal.keyResults.length > 0 && (
                            <div className="space-y-4">
                              <h3 className="font-semibold">Key Results</h3>
                              <div className="space-y-3">
                                {goal.keyResults.map((kr: GoalKeyResult, index: number) => {
                                  const krProgress = kr.metrics.reduce((sum: number, m: GoalMetric) => 
                                    sum + (m.current / m.target) * 100, 0
                                  ) / kr.metrics.length
                                  
                                  return (
                                    <Card key={index} className="p-4 bg-muted/50">
                                      <div className="flex items-start gap-4">
                                        <CircularProgress value={Math.round(krProgress)} size={40} strokeWidth={3} />
                                        <div className="flex-1">
                                          <p className="font-medium">{kr.description}</p>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Due {formatSafeDate(kr.targetDate)}
                                          </p>
                                          {kr.metrics.length > 0 && (
                                            <div className="mt-2 flex gap-4">
                                              {kr.metrics.map((m: GoalMetric, i: number) => (
                                                <Badge key={i} variant="secondary" className="gap-1">
                                                  <span>{m.name}:</span>
                                                  <span className="tabular-nums">
                                                    {m.current}/{m.target}{m.unit}
                                                  </span>
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
} 